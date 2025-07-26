import { Flashcard, QuizQuestion } from '../types';

export const generateFlashcards = (text: string): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  
  // Simple target count
  const targetCount = 15;
  
  // Clean and prepare text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30);
  
  // Extract definitions and key concepts
  const definitions = extractDefinitions(cleanText);
  const keyTerms = extractKeyTerms(cleanText);
  const processes = extractProcesses(cleanText);
  const facts = extractFactualStatements(cleanText);
  const comparisons = extractComparisons(cleanText);
  
  // Generate definition flashcards
  definitions.forEach((def, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `What is ${def.term}?`,
        answer: def.definition,
        category: 'Definition'
      });
    }
  });
  
  // Generate key term flashcards
  keyTerms.forEach((term, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `Explain the significance of "${term.term}"`,
        answer: term.context,
        category: 'Key Concept'
      });
    }
  });
  
  // Generate process flashcards
  processes.forEach((process, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `How does ${process.name} work?`,
        answer: process.steps,
        category: 'Process'
      });
    }
  });
  
  // Generate factual flashcards
  facts.forEach((fact, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: fact.question,
        answer: fact.answer,
        category: 'Fact'
      });
    }
  });
  
  // Generate comparison flashcards
  comparisons.forEach((comp, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `Compare ${comp.item1} and ${comp.item2}`,
        answer: comp.comparison,
        category: 'Comparison'
      });
    }
  });
  
  return flashcards.slice(0, targetCount);
};

export const generateQuizQuestions = (text: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Simple target count
  const targetCount = 10;
  
  // Extract different types of content for quiz questions
  const definitions = extractDefinitions(cleanText);
  const facts = extractFactualStatements(cleanText);
  const processes = extractProcesses(cleanText);
  const numbers = extractNumericalFacts(cleanText);
  const relationships = extractCauseEffect(cleanText);
  
  // Generate definition-based questions
  definitions.forEach((def, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generatePlausibleIncorrectOptions(def.definition, definitions);
      const options = shuffleArray([def.definition, ...incorrectOptions]);
      const correctAnswer = options.indexOf(def.definition);
      
      questions.push({
        id: questions.length + 1,
        question: `Which of the following best defines "${def.term}"?`,
        options,
        correctAnswer,
        explanation: `${def.term} is correctly defined as: ${def.definition}`
      });
    }
  });
  
  // Generate factual questions
  facts.forEach((fact, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateFactualIncorrectOptions(fact.answer, facts);
      const options = shuffleArray([fact.answer, ...incorrectOptions]);
      const correctAnswer = options.indexOf(fact.answer);
      
      questions.push({
        id: questions.length + 1,
        question: fact.question,
        options,
        correctAnswer,
        explanation: `The correct answer is: ${fact.answer}`
      });
    }
  });
  
  // Generate process-based questions
  processes.forEach((process, index) => {
    if (questions.length < targetCount) {
      const steps = process.steps.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 10);
      if (steps.length >= 2) {
        const correctStep = steps[0];
        const incorrectOptions = generateProcessIncorrectOptions(correctStep, steps);
        const options = shuffleArray([correctStep, ...incorrectOptions]);
        const correctAnswer = options.indexOf(correctStep);
        
        questions.push({
          id: questions.length + 1,
          question: `What is the first step in ${process.name}?`,
          options,
          correctAnswer,
          explanation: `The process begins with: ${correctStep}`
        });
      }
    }
  });
  
  // Generate numerical questions
  numbers.forEach((num, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateNumericalIncorrectOptions(num.value);
      const options = shuffleArray([num.value, ...incorrectOptions]);
      const correctAnswer = options.indexOf(num.value);
      
      questions.push({
        id: questions.length + 1,
        question: num.question,
        options,
        correctAnswer,
        explanation: `The correct value is ${num.value}: ${num.context}`
      });
    }
  });
  
  // Generate cause-effect questions
  relationships.forEach((rel, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateCauseEffectIncorrectOptions(rel.effect, relationships);
      const options = shuffleArray([rel.effect, ...incorrectOptions]);
      const correctAnswer = options.indexOf(rel.effect);
      
      questions.push({
        id: questions.length + 1,
        question: `What is the result of ${rel.cause}?`,
        options,
        correctAnswer,
        explanation: `${rel.cause} leads to: ${rel.effect}`
      });
    }
  });
  
  return questions.slice(0, targetCount);
};

// Enhanced extraction functions
const extractDefinitions = (text: string): { term: string; definition: string }[] => {
  const definitions: { term: string; definition: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const definitionPatterns = [
    /(.+?)\s+is\s+defined\s+as\s+(.+)/i,
    /(.+?)\s+refers\s+to\s+(.+)/i,
    /(.+?)\s+means\s+(.+)/i,
    /(.+?):\s+(.+)/i,
    /(.+?)\s+is\s+(.+)/i,
    /(.+?)\s+can\s+be\s+described\s+as\s+(.+)/i,
    /(.+?)\s+represents\s+(.+)/i,
    /(.+?)\s+involves\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const term = match[1].trim().replace(/^(The|A|An)\s+/i, '');
        const definition = match[2].trim();
        
        if (term.length > 2 && term.length < 100 && 
            definition.length > 15 && definition.length < 300 &&
            !term.includes('this') && !term.includes('that') &&
            !definition.toLowerCase().includes('undefined')) {
          definitions.push({ term, definition });
          break;
        }
      }
    }
  });
  
  return definitions.slice(0, 8);
};

const extractKeyTerms = (text: string): { term: string; context: string }[] => {
  const terms: { term: string; context: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  // Look for capitalized terms and technical terms
  const technicalPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    /\b([a-z]+(?:tion|sion|ment|ness|ity|ism|ology|graphy))\b/gi,
    /"([^"]+)"/g,
    /\*([^*]+)\*/g
  ];
  
  sentences.forEach(sentence => {
    if (sentence.length > 50) {
      technicalPatterns.forEach(pattern => {
        const matches = sentence.matchAll(pattern);
        for (const match of matches) {
          const term = match[1];
          if (term && term.length > 3 && term.length < 50) {
            const context = sentence.trim().substring(0, 200);
            if (context.length > 30) {
              terms.push({ term, context });
            }
          }
        }
      });
    }
  });
  
  // Remove duplicates and return top terms
  const uniqueTerms = terms.filter((term, index, self) => 
    index === self.findIndex(t => t.term.toLowerCase() === term.term.toLowerCase())
  );
  
  return uniqueTerms.slice(0, 6);
};

const extractProcesses = (text: string): { name: string; steps: string }[] => {
  const processes: { name: string; steps: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const processPatterns = [
    /(.+?)\s+process\s+(?:involves|includes|consists of|requires)\s+(.+)/i,
    /(?:The|A)\s+(.+?)\s+method\s+(.+)/i,
    /(?:To|In order to)\s+(.+?),\s+(.+)/i,
    /(.+?)\s+procedure\s+(.+)/i,
    /(.+?)\s+algorithm\s+(.+)/i,
    /(.+?)\s+workflow\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of processPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const name = match[1].trim();
        const steps = match[2].trim();
        
        if (name.length > 5 && name.length < 80 && 
            steps.length > 20 && steps.length < 400) {
          processes.push({ name, steps });
          break;
        }
      }
    }
  });
  
  return processes.slice(0, 5);
};

const extractFactualStatements = (text: string): { question: string; answer: string }[] => {
  const facts: { question: string; answer: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 40 && trimmed.length < 200) {
      // Look for factual statements with specific patterns
      const factPatterns = [
        /(.+?)\s+was\s+(.+)/i,
        /(.+?)\s+were\s+(.+)/i,
        /(.+?)\s+has\s+(.+)/i,
        /(.+?)\s+have\s+(.+)/i,
        /(.+?)\s+contains\s+(.+)/i,
        /(.+?)\s+includes\s+(.+)/i,
        /(.+?)\s+consists\s+of\s+(.+)/i,
        /(.+?)\s+comprises\s+(.+)/i
      ];
      
      for (const pattern of factPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1] && match[2]) {
          const subject = match[1].trim();
          const predicate = match[2].trim();
          
          if (subject.length > 5 && predicate.length > 10) {
            facts.push({
              question: `What can be said about ${subject}?`,
              answer: `${subject} ${match[0].includes('was') ? 'was' : match[0].includes('were') ? 'were' : match[0].includes('has') ? 'has' : match[0].includes('have') ? 'have' : match[0].includes('contains') ? 'contains' : match[0].includes('includes') ? 'includes' : match[0].includes('consists') ? 'consists of' : 'comprises'} ${predicate}`
            });
            break;
          }
        }
      }
    }
  });
  
  return facts.slice(0, 6);
};

const extractNumericalFacts = (text: string): { question: string; value: string; context: string }[] => {
  const numbers: { question: string; value: string; context: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const numberMatches = sentence.match(/\b(\d+(?:\.\d+)?(?:%|°C|°F|kg|g|m|cm|mm|km|mph|kph|years?|months?|days?|hours?|minutes?|seconds?)?)\b/g);
    
    if (numberMatches) {
      numberMatches.forEach(num => {
        const context = sentence.trim();
        if (context.length > 30 && context.length < 200) {
          // Create question based on context
          const beforeNum = context.substring(0, context.indexOf(num));
          const afterNum = context.substring(context.indexOf(num) + num.length);
          
          if (beforeNum.length > 10) {
            numbers.push({
              question: `What is the value mentioned in: "${beforeNum.trim()}___${afterNum.trim()}"?`,
              value: num,
              context: context
            });
          }
        }
      });
    }
  });
  
  return numbers.slice(0, 4);
};

const extractCauseEffect = (text: string): { cause: string; effect: string }[] => {
  const relationships: { cause: string; effect: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const causeEffectPatterns = [
    /(.+?)\s+(?:causes|leads to|results in|produces)\s+(.+)/i,
    /(?:Because of|Due to|As a result of)\s+(.+?),\s+(.+)/i,
    /(?:If|When)\s+(.+?),\s+(?:then\s+)?(.+)/i,
    /(.+?)\s+therefore\s+(.+)/i,
    /(.+?)\s+consequently\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of causeEffectPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const cause = match[1].trim();
        const effect = match[2].trim();
        
        if (cause.length > 10 && cause.length < 150 && 
            effect.length > 10 && effect.length < 150) {
          relationships.push({ cause, effect });
          break;
        }
      }
    }
  });
  
  return relationships.slice(0, 4);
};

const extractComparisons = (text: string): { item1: string; item2: string; comparison: string }[] => {
  const comparisons: { item1: string; item2: string; comparison: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const comparisonPatterns = [
    /(.+?)\s+(?:differs from|is different from|contrasts with)\s+(.+?)\s+(?:in that|because)\s+(.+)/i,
    /(?:Unlike|In contrast to)\s+(.+?),\s+(.+?)\s+(.+)/i,
    /(.+?)\s+(?:while|whereas)\s+(.+?)\s+(.+)/i,
    /(.+?)\s+and\s+(.+?)\s+(?:differ|vary)\s+(?:in|by)\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of comparisonPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        const item1 = match[1].trim();
        const item2 = match[2].trim();
        const comparison = match[3].trim();
        
        if (item1.length > 5 && item2.length > 5 && comparison.length > 15) {
          comparisons.push({ item1, item2, comparison });
          break;
        }
      }
    }
  });
  
  return comparisons.slice(0, 3);
};

// Enhanced incorrect option generators
const generatePlausibleIncorrectOptions = (correctAnswer: string, allDefinitions: { term: string; definition: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other definitions as incorrect options
  const otherDefinitions = allDefinitions
    .filter(def => def.definition !== correctAnswer)
    .map(def => def.definition)
    .slice(0, 2);
  
  options.push(...otherDefinitions);
  
  // Generate plausible but incorrect variations
  const words = correctAnswer.split(' ');
  if (words.length > 5) {
    // Swap some words around
    const shuffledWords = [...words];
    const midPoint = Math.floor(words.length / 2);
    [shuffledWords[1], shuffledWords[midPoint]] = [shuffledWords[midPoint], shuffledWords[1]];
    options.push(shuffledWords.join(' '));
  }
  
  // Add generic incorrect options if needed
  while (options.length < 3) {
    const genericOptions = [
      'A method used for data processing and analysis',
      'A technique for improving system performance',
      'A process that enhances operational efficiency',
      'A framework for managing complex operations'
    ];
    
    const randomOption = genericOptions[Math.floor(Math.random() * genericOptions.length)];
    if (!options.includes(randomOption)) {
      options.push(randomOption);
    }
  }
  
  return options.slice(0, 3);
};

const generateFactualIncorrectOptions = (correctAnswer: string, allFacts: { question: string; answer: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other factual answers as incorrect options
  const otherAnswers = allFacts
    .filter(fact => fact.answer !== correctAnswer)
    .map(fact => fact.answer)
    .slice(0, 2);
  
  options.push(...otherAnswers);
  
  // Generate variations of the correct answer
  if (options.length < 3) {
    const words = correctAnswer.split(' ');
    if (words.length > 3) {
      // Create a variation by changing key words
      const variation = words.map((word, index) => {
        if (index === 1 || index === words.length - 2) {
          const alternatives = ['not', 'never', 'always', 'sometimes', 'often', 'rarely'];
          return alternatives[Math.floor(Math.random() * alternatives.length)];
        }
        return word;
      }).join(' ');
      options.push(variation);
    }
  }
  
  // Fill remaining slots with generic options
  while (options.length < 3) {
    options.push('This statement is not supported by the text');
  }
  
  return options.slice(0, 3);
};

const generateProcessIncorrectOptions = (correctStep: string, allSteps: string[]): string[] => {
  const options: string[] = [];
  
  // Use other steps as incorrect options
  const otherSteps = allSteps.filter(step => step !== correctStep).slice(0, 2);
  options.push(...otherSteps);
  
  // Generate plausible but incorrect process steps
  while (options.length < 3) {
    const genericSteps = [
      'Initialize the system parameters',
      'Validate the input data',
      'Execute the primary algorithm',
      'Perform error checking and validation'
    ];
    
    const randomStep = genericSteps[Math.floor(Math.random() * genericSteps.length)];
    if (!options.includes(randomStep)) {
      options.push(randomStep);
    }
  }
  
  return options.slice(0, 3);
};

const generateNumericalIncorrectOptions = (correctValue: string): string[] => {
  const options: string[] = [];
  const numMatch = correctValue.match(/(\d+(?:\.\d+)?)/);
  
  if (numMatch) {
    const baseNum = parseFloat(numMatch[1]);
    const unit = correctValue.replace(numMatch[1], '');
    
    // Generate nearby values
    options.push(`${(baseNum * 1.5).toFixed(baseNum % 1 === 0 ? 0 : 1)}${unit}`);
    options.push(`${(baseNum * 0.7).toFixed(baseNum % 1 === 0 ? 0 : 1)}${unit}`);
    options.push(`${(baseNum + 10).toFixed(baseNum % 1 === 0 ? 0 : 1)}${unit}`);
  } else {
    // Non-numeric values
    options.push('Approximately half of the stated value');
    options.push('Double the mentioned amount');
    options.push('The value is not specified in the text');
  }
  
  return options.slice(0, 3);
};

const generateCauseEffectIncorrectOptions = (correctEffect: string, allRelationships: { cause: string; effect: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other effects as incorrect options
  const otherEffects = allRelationships
    .filter(rel => rel.effect !== correctEffect)
    .map(rel => rel.effect)
    .slice(0, 2);
  
  options.push(...otherEffects);
  
  // Generate opposite or unrelated effects
  while (options.length < 3) {
    const genericEffects = [
      'No significant change occurs',
      'The opposite effect takes place',
      'Multiple unrelated outcomes result',
      'The system returns to its original state'
    ];
    
    const randomEffect = genericEffects[Math.floor(Math.random() * genericEffects.length)];
    if (!options.includes(randomEffect)) {
      options.push(randomEffect);
    }
  }
  
  return options.slice(0, 3);
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};