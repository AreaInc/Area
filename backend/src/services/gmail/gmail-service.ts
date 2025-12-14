import { BaseService } from "../../common/base/base-service";
import { IServiceConfig } from "../../common/types/interfaces";
import {
  ServiceProvider,
  ActionType,
  CredentialType,
} from "../../common/types/enums";
import { SendEmailAction } from "./actions/send-email-action";
import { ReadEmailAction } from "./actions/read-email-action";

export class GmailService extends BaseService {
  constructor() {
    const config: IServiceConfig = {
      metadata: {
        provider: ServiceProvider.GMAIL,
        name: "Gmail",
        description: "Send and receive emails using Gmail",
        imageUrl:
          "https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png",
        version: "1.0.0",
        supportedActions: [ActionType.SEND_EMAIL, ActionType.READ_EMAIL],
        credentialTypes: [CredentialType.OAUTH2],
      },
      actions: [new SendEmailAction(), new ReadEmailAction()],
    };

    super(config);
  }
}
