import { Test, TestingModule } from "@nestjs/testing";
import { CronTrigger } from "./cron.trigger";
import { WORKFLOWS_SERVICE } from "../../workflows/workflows.constants";

describe("CronTrigger", () => {
    let trigger: CronTrigger;
    let workflowsServiceMock: any;

    beforeEach(async () => {
        jest.useFakeTimers();

        workflowsServiceMock = {
            triggerWorkflowExecution: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CronTrigger,
                { provide: WORKFLOWS_SERVICE, useValue: workflowsServiceMock },
            ],
        }).compile();

        trigger = module.get<CronTrigger>(CronTrigger);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should register and trigger workflow", async () => {
        const config = { cron: "*/1 * * * *" }; // Every minute

        await trigger.register(1, config);
        expect(trigger.isRegistered(1)).toBe(true);

        // Advance time to next minute
        jest.advanceTimersByTime(60000 + 1000);

        expect(workflowsServiceMock.triggerWorkflowExecution).toHaveBeenCalled();
    });

    it("should unregister workflow", async () => {
        const config = { cron: "*/1 * * * *" };
        await trigger.register(1, config);
        await trigger.unregister(1);
        expect(trigger.isRegistered(1)).toBe(false);
    });

    it("should validate cron expression", async () => {
        await expect(trigger.validateConfig({ cron: "*/1 * * * *" })).resolves.toBe(true);
        await expect(trigger.validateConfig({})).rejects.toThrow();
    });
});
