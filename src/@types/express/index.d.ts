
declare global {
  namespace Express {
    interface Request {
      user?: import('../../modules/auth/types/user-from-jwt').UserFromJwt;
    }
  

    namespace Multer {
      interface File {
        /** Nome original do arquivo */
        originalname: string;
        /** MimeType detectado */
        mimetype: string;
        /** Buffer do arquivo (quando memoryStorage é usado) */
        buffer: Buffer;
        /** Nome no sistema de arquivos (quando diskStorage é usado) */
        filename: string;
        /** Caminho no sistema de arquivos (quando diskStorage é usado) */
        path?: string;
        /** Tamanho em bytes */
        size: number;
      }
    }
  }
}

export { };

