import * as pdfjsLib from 'pdfjs-dist';
import { Flashcard, QuizQuestion } from '../types';

// Main generation functions
export const generateFlashcards = (text: string): Flashcard[] => {
  console.log('🔍 Starting precise flashcard generation...');
  
  const analysis = analyzeDocumentPrecisely(text);
  console.log('📊 Analysis complete:', {
    definitions: analysis.definitions.length,
    keyFacts: analysis.keyFacts.length,
    processes: analysis.processes.length,
    concepts: analysis.concepts.length
  });
  
  const flashcards = createPreciseFlashcards(analysis);
  console.log('✅ Generated', flashcards.length, 'high-quality flashcards');
  
  return flashcards;
};

export const generateQuizQuestions = (text: string): QuizQuestion[] => {
  console.log('🔍 Starting precise quiz generation...');
  
  const analysis = analyzeDocumentPrecisely(text);
  const questions = createPreciseQuizQuestions(analysis);
  
  console.log('✅ Generated', questions.length, 'high-quality quiz questions');
  return questions;
};

// Precise document analysis
interface PreciseAnalysis {
  definitions: Array<{
    term: string;
    definition: string;
    sentence: string;
    confidence: number;
  }>;
  keyFacts: Array<{
    fact: string;
    context: string;
    type: 'numerical' | 'date' | 'location' | 'statement';
    confidence: number;
  }>;
  processes: Array<{
    name: string;
    steps: string[];
    context: string;
    confidence: number;
  }>;
  concepts: Array<{
    name: string;
    explanation: string;
    context: string;
    confidence: number;
  }>;
  relationships: Array<{
    subject: string;
    relationship: string;
    object: string;
    context: string;
    confidence: number;
  }>;
}

const analyzeDocumentPrecisely = (text: string): PreciseAnalysis => {
  // Clean and prepare text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:()\-"']/g, '')
    .trim();
  
  // Split into meaningful sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 500)
    .filter(s => !isLowQualitySentence(s));
  
  console.log(`📝 Processing ${sentences.length} quality sentences`);
  
  return {
    definitions: extractPreciseDefinitions(sentences),
    keyFacts: extractKeyFacts(sentences),
    processes: extractProcesses(sentences),
    concepts: extractConcepts(sentences),
    relationships: extractRelationships(sentences)
  };
};

// Extract precise definitions
const extractPreciseDefinitions = (sentences: string[]) => {
  const definitions = [];
  
  for (const sentence of sentences) {
    // Pattern 1: "X is Y" (most reliable)
    const pattern1 = /^([A-Z][a-zA-Z\s]{2,40})\s+is\s+([^.!?]+)$/i;
    const match1 = sentence.match(pattern1);
    if (match1) {
      const term = match1[1].trim();
      const definition = match1[2].trim();
      
      if (isValidTerm(term) && isValidDefinition(definition)) {
        definitions.push({
          term,
          definition,
          sentence,
          confidence: 9
        });
        continue;
      }
    }
    
    // Pattern 2: "X means Y" or "X refers to Y"
    const pattern2 = /^([A-Z][a-zA-Z\s]{2,40})\s+(means|refers to|denotes)\s+([^.!?]+)$/i;
    const match2 = sentence.match(pattern2);
    if (match2) {
      const term = match2[1].trim();
      const definition = match2[3].trim();
      
      if (isValidTerm(term) && isValidDefinition(definition)) {
        definitions.push({
          term,
          definition,
          sentence,
          confidence: 8
        });
        continue;
      }
    }
    
    // Pattern 3: "The term X is defined as Y"
    const pattern3 = /(?:The\s+term\s+|The\s+concept\s+of\s+)?([A-Z][a-zA-Z\s]{2,40})\s+is\s+defined\s+as\s+([^.!?]+)/i;
    const match3 = sentence.match(pattern3);
    if (match3) {
      const term = match3[1].trim();
      const definition = match3[2].trim();
      
      if (isValidTerm(term) && isValidDefinition(definition)) {
        definitions.push({
          term,
          definition,
          sentence,
          confidence: 9
        });
      }
    }
  }
  
  // Sort by confidence and remove duplicates
  return definitions
    .sort((a, b) => b.confidence - a.confidence)
    .filter((def, index, arr) => 
      arr.findIndex(d => d.term.toLowerCase() === def.term.toLowerCase()) === index
    )
    .slice(0, 15);
};

// Extract key facts
const extractKeyFacts = (sentences: string[]) => {
  const facts = [];
  
  for (const sentence of sentences) {
    let confidence = 0;
    let type: 'numerical' | 'date' | 'location' | 'statement' = 'statement';
    
    // Numerical facts
    if (/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred|dollars?|\$)/.test(sentence)) {
      confidence = 8;
      type = 'numerical';
    }
    // Date facts
    else if (/(?:19|20)\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/.test(sentence)) {
      confidence = 7;
      type = 'date';
    }
    // Location facts
    else if (/\b(?:in|at|located|situated|found)\s+[A-Z][a-zA-Z\s,]{3,30}\b/.test(sentence)) {
      confidence = 6;
      type = 'location';
    }
    // Research/study facts
    else if (/\b(?:research|study|studies|data|evidence|findings|results)\s+(?:shows?|indicates?|suggests?|reveals?|demonstrates?)/.test(sentence)) {
      confidence = 7;
      type = 'statement';
    }
    // Important statements
    else if (/\b(?:important|significant|crucial|essential|key|main|primary|major)\b/.test(sentence)) {
      confidence = 5;
      type = 'statement';
    }
    
    if (confidence >= 5 && sentence.length >= 20 && sentence.length <= 200) {
      facts.push({
        fact: sentence,
        context: sentence,
        type,
        confidence
      });
    }
  }
  
  return facts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12);
};

// Extract processes
const extractProcesses = (sentences: string[]) => {
  const processes = [];
  
  for (const sentence of sentences) {
    // Look for process indicators
    if (/\b(?:process|procedure|method|steps|stages|phases)\b/i.test(sentence)) {
      // Extract numbered steps
      const numberedSteps = sentence.match(/\d+\.\s*([^.]+)/g);
      if (numberedSteps && numberedSteps.length > 1) {
        const steps = numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim());
        processes.push({
          name: 'Process described in document',
          steps,
          context: sentence,
          confidence: 8
        });
        continue;
      }
      
      // Extract sequential indicators
      const sequentialWords = ['first', 'second', 'third', 'then', 'next', 'finally', 'lastly'];
      const hasSequential = sequentialWords.some(word => 
        sentence.toLowerCase().includes(word)
      );
      
      if (hasSequential) {
        const parts = sentence.split(/\b(?:first|second|third|then|next|finally|lastly)\b/i)
          .map(part => part.trim())
          .filter(part => part.length > 10);
        
        if (parts.length > 1) {
          processes.push({
            name: 'Sequential process',
            steps: parts,
            context: sentence,
            confidence: 7
          });
        }
      }
    }
    
    // "To X, you must Y" patterns
    const toPattern = /^(?:To|In order to)\s+([^,]+),\s+(?:you must|one must|it is necessary to|you need to)\s+([^.!?]+)/i;
    const toMatch = sentence.match(toPattern);
    if (toMatch) {
      processes.push({
        name: toMatch[1].trim(),
        steps: [toMatch[2].trim()],
        context: sentence,
        confidence: 6
      });
    }
  }
  
  return processes
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
};

// Extract concepts
const extractConcepts = (sentences: string[]) => {
  const concepts = [];
  
  for (const sentence of sentences) {
    // "The concept of X involves Y"
    const conceptPattern1 = /(?:The\s+)?concept\s+of\s+([^,]+),?\s+(?:involves|includes|encompasses)\s+([^.!?]+)/i;
    const match1 = sentence.match(conceptPattern1);
    if (match1) {
      concepts.push({
        name: match1[1].trim(),
        explanation: match1[2].trim(),
        context: sentence,
        confidence: 8
      });
      continue;
    }
    
    // "X theory states that Y"
    const theoryPattern = /([A-Z][a-zA-Z\s]{3,30})\s+(?:theory|principle|law|rule)\s+(?:states|suggests|indicates)\s+that\s+([^.!?]+)/i;
    const theoryMatch = sentence.match(theoryPattern);
    if (theoryMatch) {
      concepts.push({
        name: theoryMatch[1].trim() + ' theory',
        explanation: theoryMatch[2].trim(),
        context: sentence,
        confidence: 8
      });
      continue;
    }
    
    // "X is important because Y"
    const importantPattern = /([A-Z][a-zA-Z\s]{3,40})\s+is\s+(?:important|significant|crucial)\s+because\s+([^.!?]+)/i;
    const importantMatch = sentence.match(importantPattern);
    if (importantMatch) {
      concepts.push({
        name: importantMatch[1].trim(),
        explanation: `Important because ${importantMatch[2].trim()}`,
        context: sentence,
        confidence: 7
      });
    }
  }
  
  return concepts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
};

// Extract relationships
const extractRelationships = (sentences: string[]) => {
  const relationships = [];
  
  for (const sentence of sentences) {
    // "X causes Y"
    const causalPattern = /([A-Z][a-zA-Z\s]{3,40})\s+(causes|leads to|results in|produces)\s+([^.!?]+)/i;
    const causalMatch = sentence.match(causalPattern);
    if (causalMatch) {
      relationships.push({
        subject: causalMatch[1].trim(),
        relationship: causalMatch[2].trim(),
        object: causalMatch[3].trim(),
        context: sentence,
        confidence: 8
      });
      continue;
    }
    
    // "X affects Y"
    const affectPattern = /([A-Z][a-zA-Z\s]{3,40})\s+(affects|influences|impacts)\s+([^.!?]+)/i;
    const affectMatch = sentence.match(affectPattern);
    if (affectMatch) {
      relationships.push({
        subject: affectMatch[1].trim(),
        relationship: affectMatch[2].trim(),
        object: affectMatch[3].trim(),
        context: sentence,
        confidence: 7
      });
    }
  }
  
  return relationships
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
};

// Create precise flashcards
const createPreciseFlashcards = (analysis: PreciseAnalysis): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  let id = 1;
  
  // From definitions (highest priority)
  analysis.definitions.forEach(def => {
    flashcards.push({
      id: id++,
      question: `What is ${def.term}?`,
      answer: def.definition,
      category: 'Definition'
    });
  });
  
  // From key facts
  analysis.keyFacts.forEach(fact => {
    if (fact.type === 'numerical') {
      const numbers = fact.fact.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred|dollars?|\$)?/g);
      if (numbers) {
        flashcards.push({
          id: id++,
          question: `What is the numerical value mentioned in: "${fact.fact.substring(0, 80)}..."?`,
          answer: `${numbers[0]} - ${fact.fact}`,
          category: 'Fact'
        });
      }
    } else if (fact.type === 'date') {
      const dates = fact.fact.match(/(?:19|20)\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?/g);
      if (dates) {
        flashcards.push({
          id: id++,
          question: `When did this occur: "${fact.fact.substring(0, 80)}..."?`,
          answer: `${dates[0]} - ${fact.fact}`,
          category: 'Fact'
        });
      }
    } else {
      flashcards.push({
        id: id++,
        question: `What is this key fact about?`,
        answer: fact.fact,
        category: 'Fact'
      });
    }
  });
  
  // From concepts
  analysis.concepts.forEach(concept => {
    flashcards.push({
      id: id++,
      question: `Explain the concept of ${concept.name}`,
      answer: concept.explanation,
      category: 'Concept'
    });
  });
  
  // From processes
  analysis.processes.forEach(process => {
    if (process.steps.length > 1) {
      flashcards.push({
        id: id++,
        question: `What are the steps in ${process.name}?`,
        answer: process.steps.join(' → '),
        category: 'Process'
      });
    }
  });
  
  // From relationships
  analysis.relationships.forEach(rel => {
    flashcards.push({
      id: id++,
      question: `How does ${rel.subject} relate to ${rel.object}?`,
      answer: `${rel.subject} ${rel.relationship} ${rel.object}`,
      category: 'Relationship'
    });
  });
  
  return flashcards.slice(0, 20);
};

// Create precise quiz questions
const createPreciseQuizQuestions = (analysis: PreciseAnalysis): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  let id = 1;
  
  // From definitions
  analysis.definitions.slice(0, 8).forEach(def => {
    const distractors = generateDefinitionDistractors(def.definition, analysis);
    const options = [def.definition, ...distractors];
    const shuffledOptions = shuffleArray(options);
    const correctIndex = shuffledOptions.indexOf(def.definition);
    
    questions.push({
      id: id++,
      question: `What is ${def.term}?`,
      options: shuffledOptions,
      correctAnswer: correctIndex,
      explanation: `${def.term} is defined as: ${def.definition}`
    });
  });
  
  // From numerical facts
  analysis.keyFacts
    .filter(fact => fact.type === 'numerical')
    .slice(0, 5)
    .forEach(fact => {
      const numbers = fact.fact.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|hundred|dollars?|\$)?/g);
      if (numbers) {
        const correctAnswer = numbers[0];
        const distractors = generateNumericalDistractors(correctAnswer);
        const options = [correctAnswer, ...distractors];
        const shuffledOptions = shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(correctAnswer);
        
        questions.push({
          id: id++,
          question: `What is the numerical value mentioned in this context: "${fact.fact.substring(0, 100)}..."?`,
          options: shuffledOptions,
          correctAnswer: correctIndex,
          explanation: `The correct answer is ${correctAnswer}. Context: ${fact.fact}`
        });
      }
    });
  
  // From concepts
  analysis.concepts.slice(0, 5).forEach(concept => {
    const distractors = generateConceptDistractors(concept.explanation, analysis);
    const options = [concept.explanation, ...distractors];
    const shuffledOptions = shuffleArray(options);
    const correctIndex = shuffledOptions.indexOf(concept.explanation);
    
    questions.push({
      id: id++,
      question: `Which statement best describes ${concept.name}?`,
      options: shuffledOptions,
      correctAnswer: correctIndex,
      explanation: `${concept.name}: ${concept.explanation}`
    });
  });
  
  return questions.slice(0, 15);
};

// Helper functions
const isLowQualitySentence = (sentence: string): boolean => {
  const lowQualityPatterns = [
    /^(?:this|that|these|those|it|they)\s/i,
    /^(?:here|there)\s/i,
    /^(?:yes|no|maybe)\s*[.!?]*$/i,
    /^\d+\s*[.!?]*$/,
    /^[A-Z\s]+$/,
    /^.{1,15}$/
  ];
  
  return lowQualityPatterns.some(pattern => pattern.test(sentence)) ||
         sentence.split(' ').length < 4 ||
         sentence.split(' ').length > 50;
};

const isValidTerm = (term: string): boolean => {
  return term.length >= 3 && 
         term.length <= 50 && 
         !/^(?:this|that|these|those|it|they|the|a|an)$/i.test(term) &&
         /[A-Za-z]/.test(term) &&
         !term.toLowerCase().includes('document') &&
         !term.toLowerCase().includes('text') &&
         !term.toLowerCase().includes('content');
};

const isValidDefinition = (definition: string): boolean => {
  return definition.length >= 15 && 
         definition.length <= 200 &&
         !/^(?:this|that|these|those|it|they)$/i.test(definition.trim()) &&
         !definition.toLowerCase().includes('document') &&
         !definition.toLowerCase().includes('text above') &&
         !definition.toLowerCase().includes('as mentioned');
};

const generateDefinitionDistractors = (correctDefinition: string, analysis: PreciseAnalysis): string[] => {
  const distractors: string[] = [];
  
  // Use other definitions from the document
  analysis.definitions.forEach(def => {
    if (def.definition !== correctDefinition && distractors.length < 3) {
      distractors.push(def.definition);
    }
  });
  
  // Use concept explanations if needed
  if (distractors.length < 3) {
    analysis.concepts.forEach(concept => {
      if (concept.explanation !== correctDefinition && distractors.length < 3) {
        distractors.push(concept.explanation);
      }
    });
  }
  
  // Fill with generic but plausible distractors
  const genericDistractors = [
    'A systematic approach to organizing and analyzing information',
    'A comprehensive framework for understanding complex relationships',
    'A methodological process for evaluating and interpreting data'
  ];
  
  while (distractors.length < 3) {
    const generic = genericDistractors[distractors.length];
    if (generic && !distractors.includes(generic)) {
      distractors.push(generic);
    } else {
      break;
    }
  }
  
  return distractors.slice(0, 3);
};

const generateNumericalDistractors = (correctAnswer: string): string[] => {
  const baseNumber = parseFloat(correctAnswer.replace(/[^\d.]/g, ''));
  const unit = correctAnswer.replace(/[\d.]/g, '');
  
  if (isNaN(baseNumber)) {
    return ['50', '100', '25'];
  }
  
  const variations = [
    Math.floor(baseNumber * 0.7) + unit,
    Math.floor(baseNumber * 1.3) + unit,
    Math.floor(baseNumber * 0.5) + unit
  ];
  
  return variations.slice(0, 3);
};

const generateConceptDistractors = (correctExplanation: string, analysis: PreciseAnalysis): string[] => {
  const distractors: string[] = [];
  
  // Use other concept explanations
  analysis.concepts.forEach(concept => {
    if (concept.explanation !== correctExplanation && distractors.length < 3) {
      distractors.push(concept.explanation);
    }
  });
  
  // Use definitions if needed
  if (distractors.length < 3) {
    analysis.definitions.forEach(def => {
      if (def.definition !== correctExplanation && distractors.length < 3) {
        distractors.push(def.definition);
      }
    });
  }
  
  // Generic concept distractors
  const genericDistractors = [
    'A theoretical framework that emphasizes systematic analysis',
    'An approach that focuses on comprehensive evaluation methods',
    'A principle that guides effective decision-making processes'
  ];
  
  while (distractors.length < 3) {
    const generic = genericDistractors[distractors.length];
    if (generic && !distractors.includes(generic)) {
      distractors.push(generic);
    } else {
      break;
    }
  }
  
  return distractors.slice(0, 3);
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};