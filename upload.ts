import * as fs from "fs";
import { google, youtube_v3 } from "googleapis";
import { getOAuth2Client } from "./getOAuth2Client";

(async () => {
  const youtube = google.youtube({
    version: "v3",
    auth: await getOAuth2Client(),
  });

  const channelId = "";
  const videoId = "";

  // const { data } = await youtube.channels.list({
  //   part: ["snippet"],
  //   // managedByMe: true,
  //   // id: [""],
  //   mine: true,
  // });

  const playlistItemList: youtube_v3.Schema$PlaylistItem[] = JSON.parse(
    await fs.promises.readFile(`output/${channelId}/${channelId}.json`, "utf8")
  );

  const videoMetadata = playlistItemList.find(
    (playlistItem) => playlistItem.snippet?.resourceId?.videoId === videoId
  );

  if (videoMetadata) {
    await upload(youtube, videoMetadata);
  }

  // const playlistItemListSort = playlistItemList.sort(
  //   (playlistItem, nextPlaylistItem) => {
  //     if (
  //       !(
  //         playlistItem.snippet?.publishedAt &&
  //         nextPlaylistItem.snippet?.publishedAt
  //       )
  //     ) {
  //       throw new Error();
  //     }

  //     return (
  //       new Date(playlistItem.snippet?.publishedAt).getTime() -
  //       new Date(nextPlaylistItem.snippet?.publishedAt).getTime()
  //     );
  //   }
  // );

  // console.log(
  //   playlistItemListSort.map((playlistItem) => playlistItem.snippet?.title)
  // );

  // for (const playlistItem of playlistItemListSort) {
  //   // await upload(youtube, playlistItem);
  // }
})();

async function upload(
  youtube: youtube_v3.Youtube,
  videoMetadata: youtube_v3.Schema$PlaylistItem
) {
  const mediaBody = fs.createReadStream(
    `output/${videoMetadata.snippet?.channelId}/video/${videoMetadata.snippet?.resourceId?.videoId}.mp4`
  );

  const { data } = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: videoMetadata?.snippet?.title,
        description: videoMetadata?.snippet?.description,
        publishedAt: videoMetadata?.snippet?.publishedAt,
        categoryId: "10",
      },
      status: {
        privacyStatus: "private",
        publishAt: "2021-01-11T16:15:00Z",
      },
    },
    media: {
      body: mediaBody,
    },
  });

  console.log(data.id);

  const thumbnailsMediaBody = fs.createReadStream(
    `output/${videoMetadata.snippet?.channelId}/img/${videoMetadata.snippet?.resourceId?.videoId}.jpg`
  );

  if (data.id) {
    await youtube.thumbnails.set({
      videoId: data.id,
      media: {
        body: thumbnailsMediaBody,
      },
    });
  }

  console.log(`Done: ${videoMetadata.contentDetails?.videoId}, ${data.id}`);
}
