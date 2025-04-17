import { LyricPlayer, BackgroundRender, PixiRenderer } from '@applemusic-like-lyrics/core';
import { getLyricLines } from './parse.js';
import { demolyricLines } from './demo-lyric.js';
import { Timer } from './timer.js';

// 歌曲信息和播放状态
let title = '';
let author = '';
let isPaused = false;
let coverUrl = '';
let seekbarPosition = 0;

// 歌词播放器相关变量
let lyricLines;
const player = new LyricPlayer();
const bg = BackgroundRender.new(PixiRenderer);

// 计时器
const timer = new Timer();

/**
 * 调用 API 更新歌曲信息和播放状态
 */
async function updateTrackInfo() {
  try {
    const response = await fetch('http://localhost:9863/query');
    
    if (!response.ok) {
      throw new Error(`请求失败，状态码为 ${response.status}`);
    }
    
    const data = await response.json();

    // 播放状态变更
    if (data.player.isPaused !== isPaused) {
      if (data.player.isPaused) {
        timer.pause();
      } else {
        timer.start();
      }
    }

    // 歌曲变更
    if (data.track.title !== title || data.track.author !== author) {
      // 调用 API 获取歌词
      lyricLines = await getLyricLines();

      // 设置歌词
      player.setLyricLines(lyricLines);

      // 更换背景
      bg.setAlbum(data.track.cover);

      // 重置计时器
      timer.reset();
      timer.setTime(data.player.seekbarCurrentPosition * 1000 + 2200);
      timer.start();
    }

    title = data.track.title;
    author = data.track.author;
    isPaused = data.player.isPaused;
    coverUrl = data.track.cover;
    seekbarPosition = data.player.seekbarCurrentPosition;

  } catch (error) {
    console.error(`query 接口响应错误：${error}`);
  }
}

// 每秒更新一次
setInterval(updateTrackInfo, 1000);

let lastTime = -1;  // 上一帧的时间戳

/**
 * 逐帧更新
 * @param {number} time 自页面加载后的时间戳
 */
function frame(time) {
  if (lastTime === -1) {
		lastTime = time;
	}
  
  // 更新播放器状态
  if (!isPaused) {
    player.setCurrentTime(timer.getTime());
  }
  
  player.update(time - lastTime);
	lastTime = time;
  
  // 请求下一帧更新
  requestAnimationFrame(frame);
}

/**
 * 初始化
 */
async function init() {
  // 调用 API 获取歌词
  lyricLines = await getLyricLines();
  // lyricLines = demolyricLines;

  // 设置歌词
  player.setLyricLines(lyricLines);

  // 获取当前播放的歌曲信息
  await updateTrackInfo();

  // 初始化播放器
  document.getElementById('player-container').appendChild(player.getElement());

  // 初始化背景
  bg.getElement().style.position = 'absolute';
  bg.getElement().style.top = '0';
  bg.getElement().style.left = '0';
  bg.getElement().style.width = '100%';
  bg.getElement().style.height = '100%';
  bg.setAlbum(coverUrl);
  document.getElementById('player-container').appendChild(bg.getElement());

  // 初始化计时器
  timer.setTime(seekbarPosition * 1000 + 2200);
  timer.start();

  // 启动歌词动画
  requestAnimationFrame(frame);
}

await init();
