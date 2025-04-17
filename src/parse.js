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

    /*
      各种情况：
      - 原版（直接返回原版歌词）
      - 原版、逐词（直接返回逐词歌词）
      - 原版、翻译（将翻译填充进原版歌词）
      - 原版、翻译、逐词（将翻译填充进原版歌词，然后填充进逐词歌词）
    */
    if (!data.hasTranslatedLyric) {
      return data.hasKaraokeLyric ? parseYrc(data.karaokeLyric) : parseLrc(data.lrc);
    }

    // 解析原版歌词和翻译歌词
    let lrcLines = parseLrc(data.lrc);
    let translatedLines = parseLrc(data.translatedLyric);

    // 将翻译按照 startTime 进行匹配，填充进原版歌词
    const translatedMap = new Map(translatedLines.map(line => [line.startTime, line]));
    lrcLines.forEach(lrcLine => {
      const match = translatedMap.get(lrcLine.startTime);
      if (match) {
          lrcLine.translatedLyric = match.words[0].word;
      }
    });

    if (!data.hasKaraokeLyric) {
      return lrcLines;
    }

    // 解析逐词歌词
    let karaokeLines = parseYrc(data.karaokeLyric);

    // 去除歌词为空的元素，避免匹配错位
    lrcLines = lrcLines.filter(line => {
      return line.words.length > 0 && line.words[0].word !== "";
    });
    translatedLines = translatedLines.filter(line => {
      return line.words.length > 0 && line.words[0].word !== "";
    });
    karaokeLines = karaokeLines.filter(line => {
      return line.words.length > 0 && line.words[0].word !== "";
    });

    // 此时原版歌词与逐词歌词的数组长度应该相等，可以按顺序填充
    let minLength = Math.min(lrcLines.length, karaokeLines.length);
    for (let i = 0; i < minLength; i++) {
      karaokeLines[i].translatedLyric = lrcLines[i].translatedLyric;
    }

    return karaokeLines;

  } catch (error) {
    console.error('获取歌词失败：', error);
  }
  return noLyric;
}
