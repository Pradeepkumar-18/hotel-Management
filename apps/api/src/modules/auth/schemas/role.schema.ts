import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, uppercase: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ type: [String], required: true, default: [] })
  permissionKeys: string[];

  @Prop({ required: true, default: false })
  system: boolean;

  @Prop({ required: true, default: true })
  active: boolean;

  @Prop({ required: true, default: 1, min: 1 })
  version: number;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({ key: 1 }, { unique: true, name: 'role_key_unique' });

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission {
  @Prop({ required: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  domain: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, default: 1, min: 1 })
  version: number;
}

export type PermissionDocument = HydratedDocument<Permission>;
export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ key: 1 }, { unique: true, name: 'permission_key_unique' });
