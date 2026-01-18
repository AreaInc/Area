import { Test, TestingModule } from "@nestjs/testing";
import { ServicesService } from "./services.service";
import { DRIZZLE } from "../../db/drizzle.module";
import { NotFoundException } from "@nestjs/common";

jest.mock("../../db/drizzle.module", () => ({
  DRIZZLE: "DRIZZLE_TOKEN",
}));

describe("ServicesService", () => {
  let service: ServicesService;
  let dbMock: any;

  beforeEach(async () => {
    dbMock = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: DRIZZLE,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return all active services", async () => {
    const services = [{ id: 1, name: "Google", isActive: true }];
    dbMock.where.mockResolvedValue(services);

    const result = await service.getAllServices();
    expect(result).toEqual(services);
    expect(dbMock.select).toHaveBeenCalled();
  });

  it("should return a service by provider", async () => {
    const serviceMock = { id: 1, provider: "google" };
    dbMock.limit.mockResolvedValue([serviceMock]);

    expect(await service.getService("google")).toEqual(serviceMock);
  });

  it("should return null if service by provider not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    expect(await service.getService("unknown")).toBeNull();
  });

  it("should return a service by id", async () => {
    const serviceMock = { id: 1 };
    dbMock.limit.mockResolvedValue([serviceMock]);
    expect(await service.getServiceById(1)).toEqual(serviceMock);
  });

  it("should throw NotFoundException if service by id not found", async () => {
    dbMock.limit.mockResolvedValue([]);
    await expect(service.getServiceById(99)).rejects.toThrow(NotFoundException);
  });
});
