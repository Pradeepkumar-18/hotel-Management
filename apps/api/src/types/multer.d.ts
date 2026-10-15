declare module 'multer' {
  export function diskStorage(options: any): any;
  export function memoryStorage(): any;
  const multer: any;
  export default multer;
}
