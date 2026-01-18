import { Test, TestingModule } from "@nestjs/testing";
import { TemporalClientService } from "./temporal-client.service";
import { Connection, Client } from "@temporalio/client";

// Mock @temporalio/client
jest.mock("@temporalio/client", () => {
  return {
    Connection: {
      connect: jest.fn(),
    },
    Client: jest.fn().mockImplementation(() => ({
      workflow: {
        start: jest.fn(),
        getHandle: jest.fn().mockReturnValue({
          cancel: jest.fn(),
          result: jest.fn(),
          describe: jest.fn(),
        }),
      },
    })),
  };
});

describe("TemporalClientService", () => {
  let service: TemporalClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporalClientService],
    }).compile();

    service = module.get<TemporalClientService>(TemporalClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should connect on module init", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({
      close: jest.fn(),
    });
    await service.onModuleInit();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Connection.connect).toHaveBeenCalled();
    expect(Client).toHaveBeenCalled();
  });

  it("should retry connection on failure", async () => {
    (Connection.connect as jest.Mock)
      .mockRejectedValueOnce(new Error("Connection failed"))
      .mockResolvedValueOnce({ close: jest.fn() });

    // Speed up retry delay
    jest.spyOn(global, "setTimeout").mockImplementation((cb: any) => cb());

    await service.onModuleInit();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Connection.connect).toHaveBeenCalledTimes(2);
  });

  it("should fail after max retries", async () => {
    (Connection.connect as jest.Mock).mockRejectedValue(
      new Error("Connection failed"),
    );
    jest.spyOn(global, "setTimeout").mockImplementation((cb: any) => cb());
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress error logs

    await expect(service.onModuleInit()).rejects.toThrow();
  });

  it("should start automation workflow", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    await service.onModuleInit();

    const clientMock = (Client as jest.Mock).mock.results[0].value;
    clientMock.workflow.start.mockResolvedValue({ id: "wf-id" });

    await service.startAutomationWorkflow("wf-id", {
      workflowId: 1,
      userId: "user1",
      triggerProvider: "gmail",
      triggerId: "on-message",
      triggerData: {},
      actionProvider: "discord",
      actionId: "send-webhook",
      actionConfig: {},
    });
    expect(clientMock.workflow.start).toHaveBeenCalled();
  });

  it("should cancel workflow", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    await service.onModuleInit();

    const clientMock = (Client as jest.Mock).mock.results[0].value;
    const handleMock = clientMock.workflow.getHandle();

    await service.cancelWorkflow("wf-id");
    expect(handleMock.cancel).toHaveBeenCalled();
  });

  it("should get workflow result", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    await service.onModuleInit();

    const clientMock = (Client as jest.Mock).mock.results[0].value;
    const handleMock = clientMock.workflow.getHandle();
    handleMock.result.mockResolvedValue("success");

    expect(await service.getWorkflowResult("wf-id")).toBe("success");
  });

  it("should return false if checking workflow running status fails", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    await service.onModuleInit();

    const clientMock = (Client as jest.Mock).mock.results[0].value;
    const handleMock = clientMock.workflow.getHandle();
    handleMock.describe.mockRejectedValue(new Error("Not found"));

    expect(await service.isWorkflowRunning("wf-id")).toBe(false);
  });

  it("should check if workflow is running", async () => {
    (Connection.connect as jest.Mock).mockResolvedValue({ close: jest.fn() });
    await service.onModuleInit();

    const clientMock = (Client as jest.Mock).mock.results[0].value;
    const handleMock = clientMock.workflow.getHandle();

    handleMock.describe.mockResolvedValue({ status: { name: "RUNNING" } });
    expect(await service.isWorkflowRunning("wf-id")).toBe(true);

    handleMock.describe.mockResolvedValue({ status: { name: "COMPLETED" } });
    expect(await service.isWorkflowRunning("wf-id")).toBe(false);
  });

  it("should close connection on destroy", async () => {
    const closeSpy = jest.fn();
    (Connection.connect as jest.Mock).mockResolvedValue({ close: closeSpy });
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(closeSpy).toHaveBeenCalled();
  });
});
