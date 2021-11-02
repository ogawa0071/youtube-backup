import * as fs from "fs";
import * as readline from "readline";
import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/youtubepartner-channel-audit",
];

const TOKEN_PATH = "token.json";

export async function getOAuth2Client() {
  const credentials = JSON.parse(
    await fs.promises.readFile("credentials.json", "utf8")
  );

  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const token = await fs.promises.readFile(TOKEN_PATH, "utf8");

    oAuth2Client.setCredentials(JSON.parse(token));
  } catch {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    console.log("Authorize this app by visiting this url:", authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise<string>((resolve) => {
      rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        resolve(code);
      });
    });

    const token = (await oAuth2Client.getToken(code)).tokens;

    oAuth2Client.setCredentials(token);

    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token));

    console.log("Token stored to", TOKEN_PATH);
  }

  return oAuth2Client;
}
