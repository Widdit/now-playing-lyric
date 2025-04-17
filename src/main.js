import { LyricPlayer, BackgroundRender, PixiRenderer } from '@applemusic-like-lyrics/core';
import { getLyricLines } from './parse.js';
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

let isUpdatingTrackInfo = false;

/**
 * 调用 API 更新歌曲信息和播放状态
 */
async function updateTrackInfo() {
  if (isUpdatingTrackInfo) {
    return;
  }

  try {
	  isUpdatingTrackInfo = true;
	
    const response = await fetch('http://localhost:9863/query');
    
    if (!response.ok) {
      throw new Error(`query 接口请求失败，状态码为 ${response.status}`);
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

    // 歌曲变更（当歌曲进度突然递减时，说明切歌/单曲循环了）
    if (data.player.seekbarCurrentPosition < seekbarPosition) {
      // 重置计时器
      timer.reset();

      // 调用 API 获取歌词
      lyricLines = await getLyricLines();

      // 设置歌词
      player.setLyricLines(lyricLines);
	  
      // 获取歌曲最新状态（此时重新 query，是因为上一步获取歌词有一定耗时，为了使歌词时间轴更准确，所以获取最新状态）
      const newResponse = await fetch('http://localhost:9863/query');
      const newData = await newResponse.json();
      
      // 启动计时器
      timer.setTime(newData.player.seekbarCurrentPosition * 1000 + 1500);
      timer.start();

      // 设置背景
      bg.setAlbum(newData.track.cover);
    }

    title = data.track.title;
    author = data.track.author;
    isPaused = data.player.isPaused;
    coverUrl = data.track.cover;
    seekbarPosition = data.player.seekbarCurrentPosition;

  } catch (error) {
    console.error(`更新歌曲信息时出错：${error}`);

  } finally {
    isUpdatingTrackInfo = false;
  }
}

// 每秒更新一次
setInterval(updateTrackInfo, 1000);

let lastTime = -1;  // 上一帧的时间戳

/**
 * 逐帧更新
 * @param {number} time 自页面加载起的时间戳
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
  // 初始化页面元素
  document.getElementById('player-container').appendChild(player.getElement());
  bg.getElement().style.position = 'absolute';
  bg.getElement().style.top = '0';
  bg.getElement().style.left = '0';
  bg.getElement().style.width = '100%';
  bg.getElement().style.height = '100%';
  document.getElementById('player-container').appendChild(bg.getElement());

  // 调用 API 获取歌词
  lyricLines = await getLyricLines();
  
  // 设置歌词
  player.setLyricLines(lyricLines);

  // 获取当前播放的歌曲信息
  await updateTrackInfo();

  // 启动计时器
  timer.setTime(seekbarPosition * 1000 + 1500);
  timer.start();

  // 启动歌词动画
  requestAnimationFrame(frame);

  // 设置背景
  bg.setAlbum(coverUrl);
}

await init();
