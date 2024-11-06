import axios from "axios";
import { generate } from "random-words";
import _ from "lodash";

type LangType = "en" | "es" | "fr" | "hi" | "ja";
type WordType = { word: string; meaning: string; options: string[] };
type fetchedDataType = { translations: { text: string }[] };

const generateMCQ = (meaning: { Text: string }[], idx: number): string[] => {
  const correctAns: string = meaning[idx].Text;

  const allMeaningExceptForCorrect = meaning.filter(
    (i) => i.Text !== correctAns
  );

  const incorrectOptions: string[] = _.sampleSize(
    allMeaningExceptForCorrect,
    3
  ).map((i) => i.Text);
  const mcqOptions = _.shuffle([...incorrectOptions, correctAns]);

  return mcqOptions;
};

export const translateWords = async (lang: LangType): Promise<WordType[]> => {
  const rapidKey = import.meta.env.VITE_RAPID_API;
  try {
    const words = generate(8).map((i) => ({ Text: i }));

    const response = await axios.post(
      "https://microsoft-translator-text-api3.p.rapidapi.com/translate",
      words,
      {
        params: {
          to: lang,
          from: "en",
          textType: "plain",
          "api-version": "3.0",
        },
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": "microsoft-translator-text-api3.p.rapidapi.com",
        },
      }
    );

    const receivedData: fetchedDataType[] = response.data;
    console.log(receivedData);

    const translatedWords: WordType[] = receivedData.map((item, idx) => {
      const options: string[] = generateMCQ(words, idx);
      return {
        word: item.translations[0].text,
        meaning: words[idx].Text,
        options,
      };
    });

    return translatedWords;
  } catch (error) {
    console.error("Error in translateWords:", error);
    throw new Error("An error occurred while translating words");
  }
};

export const countMatchingElements = (
  arr1: string[],
  arr2: string[]
): number => {
  if (arr1.length !== arr2.length)
    throw new Error("Array lengths do not match");

  let matchingCount = 0;
  arr1.forEach((item, index) => {
    if (item === arr2[index]) matchingCount++;
  });

  return matchingCount;
};

export const fetchAudio = async (
  text: string,
  language: LangType
): Promise<string> => {
  const key = import.meta.env.VITE_TEXT_TO_SPEECH_API;
  const rapidKey = import.meta.env.VITE_RAPID_API;

  const encodedParams = new URLSearchParams({
    src: text,
    r: "0",
    c: "mp3",
    f: "8khz_8bit_mono",
    b64: "true",
  });

  if (language === "ja") encodedParams.set("hl", "ja-jp");
  else if (language === "es") encodedParams.set("hl", "es-es");
  else if (language === "fr") encodedParams.set("hl", "fr-fr");
  else encodedParams.set("hl", "hi-in");

  try {
    const { data }: { data: string } = await axios.post(
      "https://voicerss-text-to-speech.p.rapidapi.com/",
      encodedParams,
      {
        params: { key },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": "voicerss-text-to-speech.p.rapidapi.com",
        },
      }
    );

    return data;
  } catch (error) {
    console.error("Error in fetchAudio:", error);
    throw new Error("An error occurred while fetching audio");
  }
};
