import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateDocumentTypeService } from '../src/modules/document-types/services/create-document-type.service';

describe('CreateDocumentTypeService (unit)', () => {
  let service: CreateDocumentTypeService;
  let repo: { create: jest.Mock };

  beforeEach(() => {
    repo = { create: jest.fn() };
    service = new CreateDocumentTypeService(repo as any);
  });

  it('deve criar um novo document type', async () => {
    const mock = {
      id: '123',
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      description: 'Teste',
      validityPeriodMonths: 0,
      isMandatory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.create.mockResolvedValue(mock);

    const result = await service.execute({
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      isMandatory: true,
    });

    expect(result).toBe(mock);
    expect(repo.create).toHaveBeenCalledWith({
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      isMandatory: true,
    });
  });

  it('deve lançar ConflictException se código já existir', async () => {
    repo.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('error', { code: 'P2002', clientVersion: '1.0.0' }),
    );

    await expect(
      service.execute({ code: 'CPF', name: 'Teste', isMandatory: true }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});