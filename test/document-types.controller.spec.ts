import { DocumentTypesController } from '../src/modules/document-types/controllers/document-types.controller';
import { CreateDocumentTypeService } from '../src/modules/document-types/services/create-document-type.service';

describe('DocumentTypesController (unit)', () => {
  let controller: DocumentTypesController;
  let service: { execute: jest.Mock };

  beforeEach(() => {
    service = { execute: jest.fn() };
    controller = new DocumentTypesController(service as unknown as CreateDocumentTypeService);
  });

  it('deve retornar DTO formatado ao criar document type', async () => {
    const now = new Date();
    service.execute.mockResolvedValue({
      id: '1',
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      description: 'Teste',
      validityPeriodMonths: 0,
      isMandatory: true,
      createdAt: now,
      updatedAt: now,
    });

    const result = await controller.create({
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      isMandatory: true,
    });

    expect(result).toEqual({
      id: '1',
      code: 'CPF',
      name: 'Cadastro de Pessoa Física',
      description: 'Teste',
      validityPeriodMonths: 0,
      isMandatory: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });
});