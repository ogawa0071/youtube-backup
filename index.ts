import { google, youtube_v3 } from "googleapis";
import * as child_process from "child_process";
import * as process from "process";
import * as fs from "fs";

const youtube = google.youtube({
  version: "v3",
  // Google APIs Explorer
  auth: "AIzaSyAa8yy0GdcGPHdtD083HiGGx_S0vMPScDM",
  headers: {
    // Google APIs Explorer
    "X-Origin": "https://explorer.apis.google.com",
  },
});

const channelId = process.argv[2] || "";

(async () => {
  const channelListResponse = (
    await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    })
  ).data;
  const uploadsPlaylist =
    channelListResponse.items?.[0].contentDetails?.relatedPlaylists?.uploads;

  let playlistItemList: youtube_v3.Schema$PlaylistItem[] = [];
  let nextPageToken = "";

  do {
    const playlistItemListResponse = (
      await youtube.playlistItems.list({
        part: ["id", "snippet", "contentDetails", "status"],
        maxResults: 50,
        playlistId: uploadsPlaylist,
        pageToken: nextPageToken,
      })
    ).data;

    playlistItemList = playlistItemListResponse.items
      ? [...playlistItemList, ...playlistItemListResponse.items]
      : [...playlistItemList];

    nextPageToken = playlistItemListResponse.nextPageToken
      ? playlistItemListResponse.nextPageToken
      : "";
  } while (nextPageToken);

  const videoIdList = playlistItemList.map(
    (playlistItem) => playlistItem.contentDetails?.videoId
  );

  for (const videoId of videoIdList) {
    const res = child_process
      .execSync(
        `youtube-dl -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' -o 'output/%(title)s-%(id)s.%(ext)s' ${videoId}`
      )
      .toString("utf8");
    console.log(res);
  }

  await fs.promises.writeFile(
    `output/${channelId}.json`,
    JSON.stringify(playlistItemList, null, 2)
  );
})();
