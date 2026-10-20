import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { HotelDocument } from './schemas/hotel.schema';
import { RoomType, RoomTypeDocument, RoomTypeStatus } from './schemas/room-type.schema';
import { BaseRate, BaseRateDocument } from '../pricing/schemas/base-rate.schema';
import { NightInventory, NightInventoryDocument } from '../inventory/schemas/night-inventory.schema';
import {
  dateInTimezone,
  validateCancellationPolicy,
  validatePolicyCurrency,
} from './hotel.policies';

export interface PublishProblem {
  code: string;
  message: string;
}

@Injectable()
export class HotelPublishChecks {
  constructor(
    @InjectModel(RoomType.name) private readonly roomTypeModel: Model<RoomTypeDocument>,
    @InjectModel(BaseRate.name) private readonly baseRateModel: Model<BaseRateDocument>,
    @InjectModel(NightInventory.name) private readonly inventoryModel: Model<NightInventoryDocument>,
  ) {}

  async collect(hotel: HotelDocument | any, session?: ClientSession): Promise<PublishProblem[]> {
    const problems: PublishProblem[] = [];
    const hotelId = hotel._id;

    // 1. Cancellation policy presence
    if (!hotel.cancellationPolicy) {
      problems.push({
        code: 'HOTEL_CANCELLATION_POLICY_REQUIRED',
        message: 'Set explicit cancellation and no-show terms before publication',
      });
    } else {
      // 2. Cancellation policy validity and effective date
      try {
        validateCancellationPolicy(hotel.cancellationPolicy);
      } catch (err: any) {
        problems.push({
          code: 'HOTEL_CANCELLATION_POLICY_INVALID',
          message: err?.message || 'Cancellation policy terms are invalid',
        });
      }

      const localToday = dateInTimezone(new Date(), hotel.timezone || 'Asia/Kolkata');
      if (hotel.cancellationPolicy.effectiveFrom > localToday) {
        problems.push({
          code: 'HOTEL_POLICY_NOT_YET_EFFECTIVE',
          message: 'Cancellation policy starts in the future and is not yet effective',
        });
      }
    }

    // 3. Active room types
    let roomTypeQuery = this.roomTypeModel.find({ hotelId, status: RoomTypeStatus.ACTIVE });
    if (session) roomTypeQuery = roomTypeQuery.session(session);
    const roomTypes = await roomTypeQuery.lean();

    if (roomTypes.length === 0) {
      problems.push({
        code: 'HOTEL_ACTIVE_ROOM_TYPES_REQUIRED',
        message: 'Add at least one active room type before publication',
      });
    } else {
      // 4. Positive sellable inventory per active room type
      if (roomTypes.some((roomType) => roomType.totalRooms < 1)) {
        problems.push({
          code: 'HOTEL_SELLABLE_INVENTORY_REQUIRED',
          message: 'Every active room type needs a positive sellable room total',
        });
      }

      const roomTypeIds = roomTypes.map((rt) => rt._id);

      // 5. Base rates for each room type
      let rateQuery = this.baseRateModel.find({ roomTypeId: { $in: roomTypeIds } });
      if (session) rateQuery = rateQuery.session(session);
      const rates = await rateQuery.lean();

      if (rates.length !== roomTypes.length) {
        problems.push({
          code: 'HOTEL_BASE_RATES_REQUIRED',
          message: 'Set a base rate for every active room type before publication',
        });
      }

      // 6. Currency uniformity and policy fee currency match
      if (rates.length > 0) {
        const currencies = new Set(rates.map((r) => r.currency));
        if (currencies.size > 1) {
          problems.push({
            code: 'HOTEL_RATE_CURRENCY_MISMATCH',
            message: 'All active room type base rates must use one hotel currency',
          });
        } else if (hotel.cancellationPolicy) {
          try {
            validatePolicyCurrency(hotel.cancellationPolicy, [...currencies][0]);
          } catch {
            problems.push({
              code: 'HOTEL_POLICY_CURRENCY_MISMATCH',
              message: 'Fixed policy fees must use the hotel base-rate currency',
            });
          }
        }
      }

      // 7. Future sellable inventory available
      const localToday = dateInTimezone(new Date(), hotel.timezone || 'Asia/Kolkata');
      let invQuery = this.inventoryModel.find({
        roomTypeId: { $in: roomTypeIds },
        stayDate: { $gte: localToday },
        $expr: { $gt: [{ $subtract: ['$total', { $add: ['$blocked', '$held', '$confirmed'] }] }, 0] },
      });
      if (session) invQuery = invQuery.session(session);
      const stockedRoomTypeIds = await invQuery.distinct('roomTypeId');

      const stockedSet = new Set(stockedRoomTypeIds.map((id: any) => id.toString()));
      if (roomTypes.some((rt) => !stockedSet.has(rt._id.toString()))) {
        problems.push({
          code: 'HOTEL_FUTURE_INVENTORY_REQUIRED',
          message: 'Every active room type needs at least one future night with available rooms',
        });
      }
    }

    return problems;
  }

  /**
   * Setup progress for the admin checklist and hotel list, derived from the same
   * rules as publishing so the UI can never disagree with the Publish button.
   */
  async readiness(hotel: HotelDocument | any, session?: ClientSession): Promise<HotelReadiness> {
    const problems = await this.collect(hotel, session);
    const hasRooms = !problems.some((p) => p.code === 'HOTEL_ACTIVE_ROOM_TYPES_REQUIRED');
    const steps = SETUP_STEPS.map((key) => {
      const stepProblems = problems.filter((p) => STEP_FOR_CODE[p.code] === key);
      // Rate and availability checks only run once room types exist.
      const blockedByRooms = (key === 'rates' || key === 'availability') && !hasRooms;
      return { key, done: stepProblems.length === 0 && !blockedByRooms, problems: stepProblems };
    });
    return {
      ready: problems.length === 0,
      done: steps.filter((s) => s.done).length,
      total: steps.length,
      steps,
      problems,
    };
  }
}

export type SetupStepKey = 'hotel' | 'rooms' | 'rates' | 'availability' | 'cancellation';

export interface HotelReadiness {
  ready: boolean;
  done: number;
  total: number;
  steps: Array<{ key: SetupStepKey; done: boolean; problems: PublishProblem[] }>;
  problems: PublishProblem[];
}

/** Hotel basics are required at creation, so the "hotel" step has no blocking codes. */
const SETUP_STEPS: SetupStepKey[] = ['hotel', 'rooms', 'rates', 'availability', 'cancellation'];

const STEP_FOR_CODE: Record<string, SetupStepKey> = {
  HOTEL_ACTIVE_ROOM_TYPES_REQUIRED: 'rooms',
  HOTEL_SELLABLE_INVENTORY_REQUIRED: 'rooms',
  HOTEL_BASE_RATES_REQUIRED: 'rates',
  HOTEL_RATE_CURRENCY_MISMATCH: 'rates',
  HOTEL_FUTURE_INVENTORY_REQUIRED: 'availability',
  HOTEL_CANCELLATION_POLICY_REQUIRED: 'cancellation',
  HOTEL_CANCELLATION_POLICY_INVALID: 'cancellation',
  HOTEL_POLICY_NOT_YET_EFFECTIVE: 'cancellation',
  HOTEL_POLICY_CURRENCY_MISMATCH: 'cancellation',
};
