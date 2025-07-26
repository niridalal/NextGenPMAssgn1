import { Flashcard, QuizQuestion } from '../types';

interface ExtractedContent {
  definitions: Array<{ term: string; definition: string; context: string; confidence: number }>;
  keyFacts: Array<{ fact: string; context: string; type: 'numerical' | 'statement' | 'research'; confidence: number }>;
  concepts: Array<{ concept: string; explanation: string; importance: string; confidence: number }>;
  processes: Array<{ process: string; steps: string[]; purpose: string; confidence: number }>;
  relationships: Array<{ entity1: string; entity2: string; relationship: string; confidence: number }>;
}

export const generateFlashcards = (pdfContent: string): Flashcard[] => {
  console.log('🎯 Starting intelligent flashcard generation...');
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful flashcard generation');
    return [];
  }

  // Extract structured content from PDF
  const extractedContent = extractStructuredContent(pdfContent);
  const flashcards: Flashcard[] = [];
  let cardId = 1;

  // Generate definition-based flashcards (highest priority)
  extractedContent.definitions
    .filter(def => def.confidence >= 7)
    .slice(0, 8)
    .forEach(def => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `What is ${def.term}?`,
        answer: def.definition,
        category: 'Definition'
      });
    });

  // Generate concept-based flashcards
  extractedContent.concepts
    .filter(concept => concept.confidence >= 6)
    .slice(0, 6)
    .forEach(concept => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `Explain the concept of ${concept.concept}`,
        answer: `${concept.explanation}${concept.importance ? ` This is important because ${concept.importance}` : ''}`,
        category: 'Concept'
      });
    });

  // Generate process-based flashcards
  extractedContent.processes
    .filter(process => process.confidence >= 6)
    .slice(0, 4)
    .forEach(process => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `What are the key steps in ${process.process}?`,
        answer: `${process.steps.join(' → ')}${process.purpose ? ` (Purpose: ${process.purpose})` : ''}`,
        category: 'Process'
      });
    });

  // Generate fact-based flashcards
  extractedContent.keyFacts
    .filter(fact => fact.confidence >= 6)
    .slice(0, 6)
    .forEach(fact => {
      const questionStarters = {
        numerical: 'What is the numerical value mentioned regarding',
        research: 'What does research show about',
        statement: 'What is an important fact about'
      };
      
      const contextWords = fact.context.split(' ').slice(0, 5).join(' ');
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `${questionStarters[fact.type]} ${contextWords}?`,
        answer: fact.fact,
        category: 'Key Fact'
      });
    });

  // Generate relationship-based flashcards
  extractedContent.relationships
    .filter(rel => rel.confidence >= 6)
    .slice(0, 4)
    .forEach(rel => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `What is the relationship between ${rel.entity1} and ${rel.entity2}?`,
        answer: rel.relationship,
        category: 'Relationship'
      });
    });

  console.log(`✅ Generated ${flashcards.length} high-quality flashcards`);
  return flashcards;
};

export const generateQuizQuestions = (pdfContent: string): QuizQuestion[] => {
  console.log('🎯 Starting intelligent quiz generation...');
  
  if (!pdfContent || pdfContent.trim().length < 100) {
    console.warn('PDF content too short for meaningful quiz generation');
    return [];
  }

  const extractedContent = extractStructuredContent(pdfContent);
  const questions: QuizQuestion[] = [];
  let questionId = 1;

  // Generate definition-based quiz questions
  extractedContent.definitions
    .filter(def => def.confidence >= 7)
    .slice(0, 5)
    .forEach(def => {
      const distractors = generateDefinitionDistractors(def.definition, extractedContent.definitions);
      const options = shuffleArray([def.definition, ...distractors]);
      const correctIndex = options.indexOf(def.definition);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `What is ${def.term}?`,
        options,
        correctAnswer: correctIndex,
        explanation: `${def.term} is defined as: ${def.definition}`
      });
    });

  // Generate concept-based quiz questions
  extractedContent.concepts
    .filter(concept => concept.confidence >= 6)
    .slice(0, 3)
    .forEach(concept => {
      const distractors = generateConceptDistractors(concept.explanation, extractedContent.concepts);
      const options = shuffleArray([concept.explanation, ...distractors]);
      const correctIndex = options.indexOf(concept.explanation);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `Which statement best explains ${concept.concept}?`,
        options,
        correctAnswer: correctIndex,
        explanation: `${concept.concept}: ${concept.explanation}`
      });
    });

  // Generate numerical fact questions
  const numericalFacts = extractedContent.keyFacts.filter(fact => 
    fact.type === 'numerical' && fact.confidence >= 6
  );
  
  numericalFacts.slice(0, 3).forEach(fact => {
    const numberMatch = fact.fact.match(/(\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|years?|months?|days?)?)/);
    if (numberMatch) {
      const correctNumber = numberMatch[1];
      const contextQuestion = fact.context.replace(numberMatch[1], '____');
      const distractors = generateNumericalDistractors(correctNumber);
      const options = shuffleArray([correctNumber, ...distractors]);
      const correctIndex = options.indexOf(correctNumber);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `Fill in the blank: ${contextQuestion}`,
        options,
        correctAnswer: correctIndex,
        explanation: `The correct answer is ${correctNumber}. ${fact.fact}`
      });
    }
  });

  console.log(`✅ Generated ${questions.length} high-quality quiz questions`);
  return questions;
};

function extractStructuredContent(content: string): ExtractedContent {
  console.log('📊 Analyzing PDF content structure...');
  
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 500)
    .filter(s => !isGenericSentence(s));

  console.log(`📝 Processing ${sentences.length} meaningful sentences`);

  const extracted: ExtractedContent = {
    definitions: [],
    keyFacts: [],
    concepts: [],
    processes: [],
    relationships: []
  };

  sentences.forEach(sentence => {
    // Extract definitions with high confidence
    const definitionPatterns = [
      /^([A-Z][a-zA-Z\s]{2,40})\s+is\s+(.{20,200})$/i,
      /^([A-Z][a-zA-Z\s]{2,40})\s+refers?\s+to\s+(.{20,200})$/i,
      /^([A-Z][a-zA-Z\s]{2,40})\s+means?\s+(.{20,200})$/i,
      /^([A-Z][a-zA-Z\s]{2,40})\s+can\s+be\s+defined\s+as\s+(.{20,200})$/i
    ];

    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const term = match[1].trim();
        const definition = match[2].trim();
        
        if (isValidTerm(term) && isValidDefinition(definition)) {
          extracted.definitions.push({
            term,
            definition,
            context: sentence,
            confidence: calculateDefinitionConfidence(term, definition, sentence)
          });
          break;
        }
      }
    }

    // Extract key facts
    if (sentence.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|years?|months?|days?)/)) {
      extracted.keyFacts.push({
        fact: sentence,
        context: sentence,
        type: 'numerical',
        confidence: calculateFactConfidence(sentence, 'numerical')
      });
    }

    // Extract research-based facts
    if (sentence.match(/(?:research|studies?|data|evidence|findings?)\s+(?:shows?|indicates?|suggests?|reveals?)/i)) {
      extracted.keyFacts.push({
        fact: sentence,
        context: sentence,
        type: 'research',
        confidence: calculateFactConfidence(sentence, 'research')
      });
    }

    // Extract important statements
    if (sentence.match(/(?:important|significant|crucial|essential|key|critical|vital)/i)) {
      extracted.keyFacts.push({
        fact: sentence,
        context: sentence,
        type: 'statement',
        confidence: calculateFactConfidence(sentence, 'statement')
      });
    }

    // Extract concepts
    const conceptPatterns = [
      /(?:concept|theory|principle|approach|method|framework)\s+of\s+([a-zA-Z\s]{3,40})\s+(?:involves|includes|encompasses|refers to)\s+(.{20,200})/i,
      /([A-Z][a-zA-Z\s]{3,40})\s+theory\s+(?:states|suggests|proposes)\s+that\s+(.{20,200})/i
    ];

    for (const pattern of conceptPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const concept = match[1].trim();
        const explanation = match[2].trim();
        
        if (isValidTerm(concept)) {
          extracted.concepts.push({
            concept,
            explanation,
            importance: extractImportance(sentence),
            confidence: calculateConceptConfidence(concept, explanation, sentence)
          });
          break;
        }
      }
    }

    // Extract processes
    const processPatterns = [
      /(?:process|procedure|method|steps?)\s+(?:of|for|to)\s+([a-zA-Z\s]{3,40})\s+(?:involves?|includes?|requires?)\s+(.{20,200})/i,
      /(?:To|In order to)\s+([a-zA-Z\s]{3,40}),\s+(?:you must|one must|it is necessary to)\s+(.{20,200})/i
    ];

    for (const pattern of processPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const process = match[1].trim();
        const stepsText = match[2].trim();
        const steps = extractSteps(stepsText);
        
        if (steps.length > 1) {
          extracted.processes.push({
            process,
            steps,
            purpose: extractPurpose(sentence),
            confidence: calculateProcessConfidence(process, steps, sentence)
          });
          break;
        }
      }
    }

    // Extract relationships
    const relationshipPatterns = [
      /([A-Z][a-zA-Z\s]{2,30})\s+(?:affects?|influences?|impacts?|causes?|leads to|results in)\s+([a-zA-Z\s]{2,30})\s+(?:by|through|via)\s+(.{10,100})/i,
      /(?:relationship|connection|link)\s+between\s+([a-zA-Z\s]{2,30})\s+and\s+([a-zA-Z\s]{2,30})\s+(?:is|involves)\s+(.{10,100})/i
    ];

    for (const pattern of relationshipPatterns) {
      const match = sentence.match(pattern);
      if (match) {
        const entity1 = match[1].trim();
        const entity2 = match[2].trim();
        const relationship = match[3].trim();
        
        if (isValidTerm(entity1) && isValidTerm(entity2)) {
          extracted.relationships.push({
            entity1,
            entity2,
            relationship,
            confidence: calculateRelationshipConfidence(entity1, entity2, relationship, sentence)
          });
          break;
        }
      }
    }
  });

  // Sort by confidence and remove duplicates
  extracted.definitions = removeDuplicateDefinitions(extracted.definitions).sort((a, b) => b.confidence - a.confidence);
  extracted.keyFacts = removeDuplicateFacts(extracted.keyFacts).sort((a, b) => b.confidence - a.confidence);
  extracted.concepts = removeDuplicateConcepts(extracted.concepts).sort((a, b) => b.confidence - a.confidence);
  extracted.processes = removeDuplicateProcesses(extracted.processes).sort((a, b) => b.confidence - a.confidence);
  extracted.relationships = removeDuplicateRelationships(extracted.relationships).sort((a, b) => b.confidence - a.confidence);

  console.log(`📊 Extracted content summary:`);
  console.log(`  📚 Definitions: ${extracted.definitions.length}`);
  console.log(`  💡 Concepts: ${extracted.concepts.length}`);
  console.log(`  📋 Processes: ${extracted.processes.length}`);
  console.log(`  📈 Key Facts: ${extracted.keyFacts.length}`);
  console.log(`  🔗 Relationships: ${extracted.relationships.length}`);

  return extracted;
}

// Helper functions for validation and scoring
function isGenericSentence(sentence: string): boolean {
  const genericPatterns = [
    /^(?:this|that|these|those|it|they|the document|the text|the paper|the study)/i,
    /^(?:as mentioned|as stated|as discussed|as shown|as seen)/i,
    /^(?:figure|table|chart|graph|image)\s+\d+/i,
    /^(?:page|section|chapter)\s+\d+/i
  ];
  
  return genericPatterns.some(pattern => pattern.test(sentence));
}

function isValidTerm(term: string): boolean {
  if (term.length < 3 || term.length > 50) return false;
  if (/^(?:this|that|these|those|it|they|the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/i.test(term)) return false;
  if (!/[A-Za-z]/.test(term)) return false;
  return true;
}

function isValidDefinition(definition: string): boolean {
  if (definition.length < 15 || definition.length > 300) return false;
  if (/^(?:this|that|these|those|it|they)$/i.test(definition.trim())) return false;
  return true;
}

function calculateDefinitionConfidence(term: string, definition: string, sentence: string): number {
  let confidence = 5;
  
  // Higher confidence for clear definition patterns
  if (sentence.includes(' is ')) confidence += 2;
  if (sentence.includes(' defined as ')) confidence += 3;
  if (sentence.includes(' refers to ')) confidence += 2;
  
  // Higher confidence for substantial definitions
  if (definition.length > 50) confidence += 1;
  if (definition.length > 100) confidence += 1;
  
  // Lower confidence for vague terms
  if (term.includes('thing') || term.includes('stuff') || term.includes('item')) confidence -= 2;
  
  return Math.min(9, Math.max(1, confidence));
}

function calculateFactConfidence(sentence: string, type: string): number {
  let confidence = 5;
  
  if (type === 'numerical') {
    if (sentence.match(/\d+%/)) confidence += 2;
    if (sentence.match(/\d+\s+(?:million|billion|thousand)/)) confidence += 1;
    if (sentence.match(/\d+\s+(?:years?|months?|days?)/)) confidence += 1;
  }
  
  if (type === 'research') {
    if (sentence.includes('study') || sentence.includes('research')) confidence += 2;
    if (sentence.includes('data') || sentence.includes('evidence')) confidence += 1;
  }
  
  if (type === 'statement') {
    if (sentence.includes('important') || sentence.includes('significant')) confidence += 1;
    if (sentence.includes('crucial') || sentence.includes('essential')) confidence += 2;
  }
  
  return Math.min(9, Math.max(1, confidence));
}

function calculateConceptConfidence(concept: string, explanation: string, sentence: string): number {
  let confidence = 5;
  
  if (sentence.includes('theory') || sentence.includes('concept')) confidence += 2;
  if (sentence.includes('principle') || sentence.includes('framework')) confidence += 1;
  if (explanation.length > 50) confidence += 1;
  
  return Math.min(9, Math.max(1, confidence));
}

function calculateProcessConfidence(process: string, steps: string[], sentence: string): number {
  let confidence = 5;
  
  if (steps.length >= 3) confidence += 2;
  if (steps.length >= 5) confidence += 1;
  if (sentence.includes('process') || sentence.includes('procedure')) confidence += 1;
  
  return Math.min(9, Math.max(1, confidence));
}

function calculateRelationshipConfidence(entity1: string, entity2: string, relationship: string, sentence: string): number {
  let confidence = 5;
  
  if (sentence.includes('affects') || sentence.includes('influences')) confidence += 2;
  if (sentence.includes('causes') || sentence.includes('leads to')) confidence += 2;
  if (relationship.length > 20) confidence += 1;
  
  return Math.min(9, Math.max(1, confidence));
}

function extractSteps(stepsText: string): string[] {
  // Try to extract numbered steps
  const numberedSteps = stepsText.match(/\d+\.\s*([^.]+)/g);
  if (numberedSteps && numberedSteps.length > 1) {
    return numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim());
  }
  
  // Try to extract steps with sequence words
  const sequenceWords = ['first', 'second', 'third', 'then', 'next', 'finally', 'lastly'];
  const steps = [];
  
  for (const word of sequenceWords) {
    const regex = new RegExp(`${word}[,\\s]+([^,.]+)`, 'i');
    const match = stepsText.match(regex);
    if (match) {
      steps.push(match[1].trim());
    }
  }
  
  return steps.length > 1 ? steps : [stepsText];
}

function extractPurpose(sentence: string): string {
  const purposeMatch = sentence.match(/(?:in order to|to|for the purpose of)\s+([^,.]+)/i);
  return purposeMatch ? purposeMatch[1].trim() : '';
}

function extractImportance(sentence: string): string {
  const importanceMatch = sentence.match(/(?:important because|significant because|crucial because)\s+([^,.]+)/i);
  return importanceMatch ? importanceMatch[1].trim() : '';
}

// Duplicate removal functions
function removeDuplicateDefinitions(definitions: any[]): any[] {
  const seen = new Set();
  return definitions.filter(def => {
    const key = def.term.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeDuplicateFacts(facts: any[]): any[] {
  const seen = new Set();
  return facts.filter(fact => {
    const key = fact.fact.substring(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeDuplicateConcepts(concepts: any[]): any[] {
  const seen = new Set();
  return concepts.filter(concept => {
    const key = concept.concept.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeDuplicateProcesses(processes: any[]): any[] {
  const seen = new Set();
  return processes.filter(process => {
    const key = process.process.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeDuplicateRelationships(relationships: any[]): any[] {
  const seen = new Set();
  return relationships.filter(rel => {
    const key = `${rel.entity1.toLowerCase()}-${rel.entity2.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Distractor generation functions
function generateDefinitionDistractors(correctDefinition: string, allDefinitions: any[]): string[] {
  const distractors = allDefinitions
    .filter(def => def.definition !== correctDefinition)
    .map(def => def.definition)
    .slice(0, 3);
  
  // Fill with generic distractors if needed
  const genericDistractors = [
    'A systematic approach to organizing and analyzing information',
    'A method used to evaluate and compare different options',
    'A framework for understanding complex relationships and patterns'
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
}

function generateConceptDistractors(correctExplanation: string, allConcepts: any[]): string[] {
  const distractors = allConcepts
    .filter(concept => concept.explanation !== correctExplanation)
    .map(concept => concept.explanation)
    .slice(0, 3);
  
  // Fill with generic distractors if needed
  const genericDistractors = [
    'A theoretical framework that provides structure for analysis',
    'An approach that emphasizes systematic evaluation and comparison',
    'A methodology that focuses on comprehensive understanding'
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
}

function generateNumericalDistractors(correctAnswer: string): string[] {
  const baseNumber = parseFloat(correctAnswer.replace(/[^\d.]/g, ''));
  const unit = correctAnswer.replace(/[\d.]/g, '');
  
  if (isNaN(baseNumber)) {
    return ['25', '50', '75'];
  }
  
  const variations = [
    Math.floor(baseNumber * 0.5) + unit,
    Math.floor(baseNumber * 1.5) + unit,
    Math.floor(baseNumber * 2) + unit
  ].filter(v => v !== correctAnswer);
  
  return variations.slice(0, 3);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}