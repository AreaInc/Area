import { NewTrackPlayedTrigger, NewLikedSongTrigger } from "./spotify-triggers";
import { TriggerType } from "../../../common/types/trigger.interface";

describe("Spotify Triggers", () => {
  describe("NewTrackPlayedTrigger", () => {
    let trigger: NewTrackPlayedTrigger;

    beforeEach(() => {
      trigger = new NewTrackPlayedTrigger();
    });

    it("should have correct metadata", () => {
      expect(trigger.id).toBe("new_track_played");
      expect(trigger.triggerType).toBe(TriggerType.POLLING);
      expect(trigger.requiresCredentials).toBe(true);
    });

    it("should register and unregister successfully", async () => {
      const config = { foo: "bar" };
      await trigger.register(1, config, 10);
      expect(trigger.getRegistrations().get(1)).toEqual({
        config,
        credentialsId: 10,
      });

      await trigger.unregister(1);
      expect(trigger.getRegistrations().has(1)).toBe(false);
    });

    it("should validate config (always true)", async () => {
      expect(await trigger.validateConfig({})).toBe(true);
    });
  });

  describe("NewLikedSongTrigger", () => {
    let trigger: NewLikedSongTrigger;

    beforeEach(() => {
      trigger = new NewLikedSongTrigger();
    });

    it("should validate config (always true)", async () => {
      expect(await trigger.validateConfig({})).toBe(true);
    });

    it("should have correct metadata", () => {
      expect(trigger.id).toBe("new_liked_song");
    });

    it("should register and unregister successfully", async () => {
      await trigger.register(1, {}, 10);
      expect(trigger.getRegistrations().has(1)).toBe(true);
      await trigger.unregister(1);
      expect(trigger.getRegistrations().has(1)).toBe(false);
    });
  });
});
