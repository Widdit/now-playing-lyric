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

    let isPlayingStatusChanged = data.player.isPaused !== isPaused;
    let isTrackedChanged = data.player.seekbarCurrentPosition < seekbarPosition;

    title = data.track.title;
    author = data.track.author;
    isPaused = data.player.isPaused;
    coverUrl = data.track.cover;
    seekbarPosition = data.player.seekbarCurrentPosition;

    // 播放状态变更
    if (isPlayingStatusChanged) {
      if (isPaused) {
        timer.pause();
      } else {
        timer.start();
      }
    }

    // 歌曲变更（当歌曲进度突然递减时，说明切歌/单曲循环了）
    if (isTrackedChanged) {
      // 重置计时器
      timer.reset();

      // 调用 API 获取歌词
      lyricLines = await getLyricLines();

      // 设置歌词
      player.setLyricLines(lyricLines);
	  
      // 获取歌曲进度条毫秒值
      const newResponse = await fetch('http://localhost:9863/query/progress');
      const newData = await newResponse.json();
      
      // 启动计时器
      timer.setTime(newData.progress + 1200);
      timer.start();

      // 设置背景
      const base64Image = await fetchBase64Image(coverUrl);
      bg.setAlbum(base64Image);
    }
  
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
 * 获取专辑图片的 BASE64 编码字符串
 * @param {string} coverUrl 专辑图片 URL
 * @returns 专辑图片的 BASE64 编码字符串
 */
async function fetchBase64Image(coverUrl) {
  try {
    const response = await fetch('http://localhost:9863/cover/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cover_url: coverUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.base64Img;

  } catch (error) {
    console.error('Fetch base64Image failed:', error);
  }
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

  // 获取歌曲进度条毫秒值
  const response = await fetch('http://localhost:9863/query/progress');
  const data = await response.json();
  
  // 启动计时器
  timer.setTime(data.progress + 1200);
  timer.start();

  // 启动歌词动画
  requestAnimationFrame(frame);

  // 设置背景
  const base64Image = await fetchBase64Image(coverUrl);
  bg.setAlbum(base64Image);
}

await init();
