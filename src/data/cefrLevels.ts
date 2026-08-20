import { CEFRLevel, CEFRLevelInfo, PlacementQuestion } from '../types';

export const CEFR_LEVELS_MAP: Record<CEFRLevel, CEFRLevelInfo> = {
  A1: {
    level: 'A1',
    name: 'Beginner',
    badgeColor: 'bg-[#0F291E] text-[#4ADE80] border-[#166534]',
    tagline: 'Foundational words & simple daily topics',
    description: 'Can understand basic phrases, familiar everyday expressions, and very simple articles with short sentences.',
    estimatedVocab: '500 - 1,000 words',
    readingSpeedWPM: '80 - 120 WPM',
    targetDescriptors: [
      'Understand simple notices, signs, and everyday descriptions',
      'Recognize familiar names, words, and basic sentence structures',
      'Follow short paragraphs about daily routines and hobbies',
    ],
  },
  A2: {
    level: 'A2',
    name: 'Elementary',
    badgeColor: 'bg-[#0E282E] text-[#2DD4BF] border-[#115E59]',
    tagline: 'Routine communications & practical stories',
    description: 'Can read short, simple texts on familiar topics such as personal life, shopping, geography, and employment.',
    estimatedVocab: '1,000 - 2,000 words',
    readingSpeedWPM: '110 - 150 WPM',
    targetDescriptors: [
      'Locate specific predictable information in simple everyday material',
      'Understand simple narratives and chronological event sequences',
      'Grasp basic cause-and-effect relationships with connectors like because and so',
    ],
  },
  B1: {
    level: 'B1',
    name: 'Intermediate',
    badgeColor: 'bg-[#291F0E] text-[#FBBF24] border-[#92400E]',
    tagline: 'Standard English on culture, science & work',
    description: 'Can understand straightforward texts on subjects related to fields of interest, hobbies, technology, and travel.',
    estimatedVocab: '2,000 - 4,000 words',
    readingSpeedWPM: '140 - 190 WPM',
    targetDescriptors: [
      'Understand main conclusions in clearly structured argumentative texts',
      'Identify key points in news articles, popular science, and interviews',
      'Infer meaning of unfamiliar words from surrounding paragraph context',
    ],
  },
  B2: {
    level: 'B2',
    name: 'Upper Intermediate',
    badgeColor: 'bg-[#182238] text-[#60A5FA] border-[#1E3A8A]',
    tagline: 'Complex articles, technical insights & viewpoints',
    description: 'Can read articles and reports concerned with contemporary problems in which writers adopt particular attitudes or viewpoints.',
    estimatedVocab: '4,000 - 7,000 words',
    readingSpeedWPM: '180 - 240 WPM',
    targetDescriptors: [
      'Read contemporary articles on complex cultural, scientific, and societal issues',
      'Distinguish fact from opinion and recognize nuances in persuasive writing',
      'Appreciate varied sentence patterns, idiomatic expressions, and phrasal verbs',
    ],
  },
  C1: {
    level: 'C1',
    name: 'Advanced',
    badgeColor: 'bg-[#241738] text-[#C084FC] border-[#581C87]',
    tagline: 'Demanding long-form essays, implicit nuances & style',
    description: 'Can understand a wide range of demanding, longer texts and recognize implicit meaning without constant dictionary checking.',
    estimatedVocab: '7,000 - 12,000 words',
    readingSpeedWPM: '220 - 300 WPM',
    targetDescriptors: [
      'Understand complex literary, academic, and analytical essays in depth',
      'Detect irony, satire, rhetorical devices, and cultural allusions',
      'Master specialized terminology, abstract metaphors, and sophisticated collocations',
    ],
  },
  C2: {
    level: 'C2',
    name: 'Mastery / Native-like',
    badgeColor: 'bg-[#31131F] text-[#FB7185] border-[#881337]',
    tagline: 'Literary prose, philosophical discourse & eloquence',
    description: 'Can read with ease virtually all forms of the written language, including abstract, structurally complex, or highly colloquial texts.',
    estimatedVocab: '12,000+ words',
    readingSpeedWPM: '260 - 350+ WPM',
    targetDescriptors: [
      'Effortlessly interpret classical literature, philosophical treatises, and specialized journals',
      'Appreciate subtle shades of meaning, register shifts, and linguistic stylistic elegance',
      'Synthesize conflicting theoretical arguments with critical precision',
    ],
  },
};

export const CEFR_LEVELS_ARRAY: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const DEFAULT_PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'diag-1',
    level: 'A1',
    passageOrPrompt: 'Sarah works at a local library. Every morning at 8:00 AM, she opens the doors and welcomes visitors. She loves books very much.',
    question: 'What time does Sarah open the library doors?',
    options: ['At 8:00 AM', 'At 9:00 PM', 'At noon', 'Every afternoon'],
    correctIndex: 0,
    explanation: 'The passage explicitly states: "Every morning at 8:00 AM, she opens the doors".',
  },
  {
    id: 'diag-2',
    level: 'A2',
    passageOrPrompt: 'Because electric cars produce zero tailpipe emissions, many cities are building charging stations to encourage commuters to switch away from gasoline vehicles.',
    question: 'Why are cities building charging stations?',
    options: [
      'To increase gasoline sales',
      'Because electric cars do not produce tailpipe emissions',
      'To make traffic lights change faster',
      'Because parking spaces are disappearing'
    ],
    correctIndex: 1,
    explanation: 'The sentence uses the causal connector "Because electric cars produce zero tailpipe emissions" to explain the encouragement of commuters.',
  },
  {
    id: 'diag-3',
    level: 'B1',
    passageOrPrompt: 'Although remote working offers significant flexibility, some employees report feeling isolated from colleagues, which can subtly dampen creative spontaneous brainstorming.',
    question: 'What is mentioned as an unintended drawback of remote work in this passage?',
    options: [
      'Lower internet speeds',
      'Higher company expenses',
      'Feelings of isolation that may reduce spontaneous brainstorming',
      'Strict office dress codes'
    ],
    correctIndex: 2,
    explanation: 'The text highlights that "some employees report feeling isolated from colleagues, which can subtly dampen creative spontaneous brainstorming".',
  },
  {
    id: 'diag-4',
    level: 'B2',
    passageOrPrompt: 'Urban architects are increasingly integrating biophilic design—incorporating natural light, indoor foliage, and organic geometries—not merely for aesthetic allure, but because empirical studies demonstrate a marked reduction in cognitive fatigue among occupants.',
    question: 'What is the primary motivation for implementing biophilic design according to empirical studies?',
    options: [
      'Lowering the cost of commercial real estate',
      'Replacing structural concrete with plant-based polymers',
      'Noticeably decreasing mental and cognitive fatigue among inhabitants',
      'Complying with mandatory international gardening regulations'
    ],
    correctIndex: 2,
    explanation: '"Empirical studies demonstrate a marked reduction in cognitive fatigue among occupants" indicates reduced mental exhaustion.',
  },
  {
    id: 'diag-5',
    level: 'C1',
    passageOrPrompt: 'The author\'s critique of algorithmic curated feeds is punctuated by an implicit skepticism toward the premise that hyper-personalization inevitably enhances intellectual autonomy.',
    question: 'What does the passage imply about the author\'s view of hyper-personalization?',
    options: [
      'The author enthusiastically endorses algorithmic curation.',
      'The author doubts that personalized feeds truly foster independent intellectual thinking.',
      'The author believes algorithms should be completely banned worldwide.',
      'The author argues that algorithms eliminate all forms of commercial advertising.'
    ],
    correctIndex: 1,
    explanation: '"Implicit skepticism toward the premise that hyper-personalization inevitably enhances intellectual autonomy" means the author doubts it promotes true intellectual independence.',
  },
  {
    id: 'diag-6',
    level: 'C2',
    passageOrPrompt: 'Far from being a perfunctory concession to contemporary sensibilities, the museum’s provenance retrospective constitutes an epistemological re-evaluation of how historical narratives are valorized and disseminated.',
    question: 'What does the phrase "epistemological re-evaluation" convey in this context?',
    options: [
      'A routine financial inventory of museum artifacts',
      'A superficial update to the gallery’s lighting and decor',
      'A profound rethinking of the fundamental nature and validity of historical knowledge',
      'A promotional campaign designed to attract younger tourists'
    ],
    correctIndex: 2,
    explanation: 'Epistemological relates to the theory of knowledge; an epistemological re-evaluation is a fundamental questioning of how knowledge and historical validity are constructed.',
  },
];
