# youtube-backup

This is a wrapper for `youtube-dl`, a tool for downloading all videos on your YouTube channel at once.

## How to use

### Docker

```sh
$ docker run -v `output`:/usr/src/app/output futa/youtube-backup [YOUTUBE_CHANNEL_ID]
```

# Node.js command line

Please install `Node.js`, `Yarn`, `youtube-dl`, `FFmpeg` before using.

```sh
$ git clone https://github.com/ogawa0071/youtube-backup.git
$ cd youtube-backup/
$ yarn install
$ yarn ts-node index.ts [YOUTUBE_CHANNEL_ID]
```
