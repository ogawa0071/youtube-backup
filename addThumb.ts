import * as fs from "fs";
import * as path from "path";
import { google, youtube_v3 } from "googleapis";
import { getOAuth2Client } from "./getOAuth2Client";
import * as _ from "lodash";

const channelId = "";
const doneOriginalVideoId = "";
const startDate = new Date("2021-01-20T00:00:00+09:00");

(async () => {
  const youtube = google.youtube({
    version: "v3",
    auth: await getOAuth2Client(),
  });

  //
  // await getOriginalVideoIdVideoIdMap(youtube);
  //

  const originalVideoIdVideoIdList: string[][] = JSON.parse(
    await fs.promises.readFile("originalVideoIdVideoIdMap.json", "utf8")
  );

  const originalVideoIdVideoIdMap = new Map<string, string>();

  for (const originalVideoIdVideoId of originalVideoIdVideoIdList) {
    originalVideoIdVideoIdMap.set(
      originalVideoIdVideoId[0],
      originalVideoIdVideoId[1]
    );
  }

  const originalPlaylistItemList: youtube_v3.Schema$PlaylistItem[] = JSON.parse(
    await fs.promises.readFile("metadata.json", "utf8")
  );

  const originalPlaylistItemListReverse = Array.from(
    originalPlaylistItemList
  ).reverse();

  const originalPlaylistItemListReverseSlice =
    originalPlaylistItemListReverse.slice(
      originalPlaylistItemListReverse.findIndex(
        (originalPlaylistItem) =>
          originalPlaylistItem.snippet?.resourceId?.videoId ===
          doneOriginalVideoId
      ) + 1
    );

  for (const originalPlaylistItem of originalPlaylistItemListReverseSlice) {
    const originalVideoId = originalPlaylistItem.snippet?.resourceId?.videoId
      ? originalPlaylistItem.snippet?.resourceId?.videoId
      : "";
    const originalChannelId = originalPlaylistItem.snippet?.channelId;
    const videoId = originalVideoIdVideoIdMap.get(originalVideoId);

    const originalPlaylistItemListReverseIndex =
      originalPlaylistItemListReverse.findIndex(
        (originalPlaylistItem) =>
          originalPlaylistItem.snippet?.resourceId?.videoId === originalVideoId
      );
    const publishDate = new Date(startDate);
    publishDate.setMinutes(originalPlaylistItemListReverseIndex);

    // await youtube.videos.update({
    //   part: ["snippet", "status"],
    //   requestBody: {
    //     id: videoId,
    //     snippet: {
    //       title: originalPlaylistItem.snippet?.title,
    //       // description: originalPlaylistItem.snippet?.description,
    //       categoryId: "10",
    //     },
    //     status: {
    //       privacyStatus: "private",
    //       publishAt: publishDate.toISOString(),
    //     },
    //   },
    // });

    await youtube.videos.update({
      part: ["snippet", "status"],
      requestBody: {
        id: videoId,
        snippet: {
          categoryId: "10",
          defaultLanguage: "ja",
          defaultAudioLanguage: "ja",
          description: originalPlaylistItem.snippet?.description,
          title: originalPlaylistItem.snippet?.title,
        },
        status: {
          embeddable: true,
        },
      },
    });

    // const thumbnailsMediaBody = fs.createReadStream(
    //   `output/${originalChannelId}/img/${originalVideoId}.jpg`
    // );

    // await youtube.thumbnails.set({
    //   videoId: videoId,
    //   media: {
    //     body: thumbnailsMediaBody,
    //   },
    // });

    console.log(`Done: ${originalVideoId}, ${videoId}`);
  }
})();

async function getOriginalVideoIdVideoIdMap(youtube: youtube_v3.Youtube) {
  const channelListResponse = (
    await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    })
  ).data;
  const uploadsPlaylist =
    channelListResponse.items?.[0].contentDetails?.relatedPlaylists?.uploads;

  let playlistItemList: youtube_v3.Schema$PlaylistItem[] = [];
  let playlistItemNextPageToken = "";

  do {
    const playlistItemListResponse = (
      await youtube.playlistItems.list({
        part: ["id", "snippet", "contentDetails", "status"],
        playlistId: uploadsPlaylist,
        maxResults: 50,
        pageToken: playlistItemNextPageToken,
      })
    ).data;

    playlistItemList = playlistItemListResponse.items
      ? [...playlistItemList, ...playlistItemListResponse.items]
      : [...playlistItemList];

    playlistItemNextPageToken = playlistItemListResponse.nextPageToken
      ? playlistItemListResponse.nextPageToken
      : "";
  } while (playlistItemNextPageToken);

  const videoIdList = playlistItemList
    .map((playlistItem) =>
      playlistItem.snippet?.resourceId?.videoId
        ? playlistItem.snippet?.resourceId?.videoId
        : ""
    )
    .filter((playlistItem) => playlistItem);

  let videoList: youtube_v3.Schema$Video[] = [];
  let videoListNextPageToken = "";

  for (const videoIdListChunk of _.chunk(videoIdList, 50)) {
    do {
      const videoListResponse = (
        await youtube.videos.list({
          part: ["id", "snippet", "contentDetails", "status", "fileDetails"],
          id: videoIdListChunk,
          maxResults: 50,
          pageToken: videoListNextPageToken,
        })
      ).data;

      videoList = videoListResponse.items
        ? [...videoList, ...videoListResponse.items]
        : [...videoList];

      videoListNextPageToken = videoListResponse.nextPageToken
        ? videoListResponse.nextPageToken
        : "";
    } while (videoListNextPageToken);
  }

  const originalPlaylistItemList: youtube_v3.Schema$PlaylistItem[] = JSON.parse(
    await fs.promises.readFile("metadata.json", "utf8")
  );

  const originalVideoIdVideoIdMap = new Map<string, string>();

  for (const video of videoList) {
    const videoId = video.id ? video.id : "";

    const fileName = video.fileDetails?.fileName
      ? video.fileDetails?.fileName
      : "";

    const originalVideoId = path.parse(fileName).name;

    originalVideoIdVideoIdMap.set(originalVideoId, videoId);
  }

  await fs.promises.writeFile(
    "originalVideoIdVideoIdMap.json",
    JSON.stringify(Array.from(originalVideoIdVideoIdMap), null, 2)
  );
}
