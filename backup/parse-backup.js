import { parseLrc, parseYrc } from "@applemusic-like-lyrics/lyric";

const noLyric = [
  {
    words: [
      {
        word: "纯音乐，请欣赏",
        startTime: 0,
        endTime: Infinity,
      },
    ],
    startTime: 0,
    endTime: Infinity,
    translatedLyric: "",
    romanLyric: "",
    isBG: false,
    isDuet: false,
  },
];

/**
 * 获取 LyricLine 数组
 * @returns LyricLine 数组
 */
export async function getLyricLines() {
  try {
    // 发送GET请求
    const response = await fetch('http://localhost:9863/api/lyric');
    
    // 检查响应是否成功
    if (!response.ok) {
        throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }
    
    // 解析JSON响应
    const data = await response.json();

    // 判断是否有歌词
    if (!data.hasLyric) {
      return noLyric;
    }
    
    let lines;

    // 判断是否有逐词歌词，如果有，则以逐词歌词作为基底；否则，以原始歌词作为基底
    if (data.hasKaraokeLyric) {
      lines = parseYrc(data.karaokeLyric);
    } else {
      lines = parseLrc(data.lrc);
    }

    // 判断是否有翻译歌词，如果有，则将翻译歌词填充进歌词对象中
    if (data.hasTranslatedLyric) {
      const translatedLines = parseLrc(data.translatedLyric);

      const minLength = Math.min(lines.length, translatedLines.length);
      for (let i = 0; i < minLength; i++) {
          const translatedWords = translatedLines[i].words;
          if (translatedWords.length > 0) {
              lines[i].translatedLyric = translatedWords[0].word;
          }
      }
    }

    return lines;

  } catch (error) {
    console.error('获取歌词失败：', error);
  }
  return noLyric;
}
