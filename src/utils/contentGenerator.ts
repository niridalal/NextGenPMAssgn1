import { Flashcard, QuizQuestion } from '../types';

interface SemanticContent {
  definitions: Array<{
    term: string;
    definition: string;
    context: string;
    importance: number;
    category: string;
  }>;
  concepts: Array<{
    concept: string;
    explanation: string;
    significance: string;
    examples: string[];
    category: string;
  }>;
  facts: Array<{
    fact: string;
    context: string;
    type: 'numerical' | 'research' | 'historical' | 'statistical';
    importance: number;
  }>;
  processes: Array<{
    name: string;
    steps: string[];
    purpose: string;
    outcome: string;
    category: string;
  }>;
  principles: Array<{
    principle: string;
    explanation: string;
    applications: string[];
    importance: number;
  }>;
}

export const generateFlashcards = (pdfContent: string): Flashcard[] => {
  console.log('🧠 Starting semantic content analysis...');
  
  if (!pdfContent || pdfContent.trim().length < 200) {
    console.warn('PDF content too short for meaningful analysis');
    return [];
  }

  const semanticContent = performSemanticAnalysis(pdfContent);
  const flashcards: Flashcard[] = [];
  let cardId = 1;

  // Generate definition-based flashcards (highest educational value)
  semanticContent.definitions
    .filter(def => def.importance >= 7)
    .slice(0, 8)
    .forEach(def => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `What is ${def.term}?`,
        answer: `${def.definition}${def.context ? `\n\nContext: ${def.context}` : ''}`,
        category: def.category || 'Definition'
      });
    });

  // Generate concept understanding flashcards
  semanticContent.concepts
    .slice(0, 6)
    .forEach(concept => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `Explain the concept of "${concept.concept}" and why it's important`,
        answer: `${concept.explanation}\n\nSignificance: ${concept.significance}${
          concept.examples.length > 0 ? `\n\nExamples: ${concept.examples.join(', ')}` : ''
        }`,
        category: concept.category || 'Concept'
      });
    });

  // Generate process-based flashcards
  semanticContent.processes
    .slice(0, 4)
    .forEach(process => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `Describe the process of ${process.name} and its purpose`,
        answer: `Steps:\n${process.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nPurpose: ${process.purpose}\n\nOutcome: ${process.outcome}`,
        category: process.category || 'Process'
      });
    });

  // Generate principle-based flashcards
  semanticContent.principles
    .filter(principle => principle.importance >= 6)
    .slice(0, 4)
    .forEach(principle => {
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `What is the principle of ${principle.principle} and how is it applied?`,
        answer: `${principle.explanation}\n\nApplications: ${principle.applications.join(', ')}`,
        category: 'Principle'
      });
    });

  // Generate fact-based flashcards
  semanticContent.facts
    .filter(fact => fact.importance >= 6)
    .slice(0, 6)
    .forEach(fact => {
      const questionTypes = {
        numerical: 'What are the key numbers/statistics mentioned regarding',
        research: 'What does research reveal about',
        historical: 'What historical information is provided about',
        statistical: 'What statistical data is presented about'
      };
      
      const contextKeywords = extractKeywords(fact.context).slice(0, 3).join(', ');
      flashcards.push({
        id: `fc-${cardId++}`,
        question: `${questionTypes[fact.type]} ${contextKeywords}?`,
        answer: `${fact.fact}\n\nContext: ${fact.context}`,
        category: 'Key Fact'
      });
    });

  console.log(`✅ Generated ${flashcards.length} high-quality, semantically relevant flashcards`);
  return flashcards;
};

export const generateQuizQuestions = (pdfContent: string): QuizQuestion[] => {
  console.log('🧠 Starting semantic quiz generation...');
  
  if (!pdfContent || pdfContent.trim().length < 200) {
    console.warn('PDF content too short for meaningful quiz generation');
    return [];
  }

  const semanticContent = performSemanticAnalysis(pdfContent);
  const questions: QuizQuestion[] = [];
  let questionId = 1;

  // Generate definition-based quiz questions
  semanticContent.definitions
    .filter(def => def.importance >= 7)
    .slice(0, 5)
    .forEach(def => {
      const distractors = generateSemanticDistractors(def.definition, semanticContent.definitions, 'definition');
      const options = shuffleArray([def.definition, ...distractors]);
      const correctIndex = options.indexOf(def.definition);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `According to the document, what is ${def.term}?`,
        options,
        correctAnswer: correctIndex,
        explanation: `${def.term} is defined as: ${def.definition}. This is important because ${def.context || 'it provides foundational understanding of the topic'}.`
      });
    });

  // Generate concept application questions
  semanticContent.concepts
    .slice(0, 4)
    .forEach(concept => {
      const distractors = generateSemanticDistractors(concept.explanation, semanticContent.concepts, 'concept');
      const options = shuffleArray([concept.explanation, ...distractors]);
      const correctIndex = options.indexOf(concept.explanation);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `How is the concept of "${concept.concept}" best explained in the document?`,
        options,
        correctAnswer: correctIndex,
        explanation: `${concept.concept}: ${concept.explanation}. ${concept.significance ? `This is significant because ${concept.significance}` : ''}`
      });
    });

  // Generate process understanding questions
  semanticContent.processes
    .slice(0, 3)
    .forEach(process => {
      const correctAnswer = `${process.steps.slice(0, 3).join(' → ')}`;
      const distractors = generateProcessDistractors(process.steps, semanticContent.processes);
      const options = shuffleArray([correctAnswer, ...distractors]);
      const correctIndex = options.indexOf(correctAnswer);

      questions.push({
        id: `quiz-${questionId++}`,
        question: `What are the main steps in the process of ${process.name}?`,
        options,
        correctAnswer: correctIndex,
        explanation: `The process of ${process.name} involves: ${process.steps.join(' → ')}. The purpose is ${process.purpose}, leading to ${process.outcome}.`
      });
    });

  // Generate factual knowledge questions
  semanticContent.facts
    .filter(fact => fact.type === 'numerical' && fact.importance >= 6)
    .slice(0, 3)
    .forEach(fact => {
      const numberMatch = fact.fact.match(/(\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|years?|months?|days?|dollars?)?)/);
      if (numberMatch) {
        const correctNumber = numberMatch[1];
        const contextQuestion = fact.context.replace(numberMatch[1], '____');
        const distractors = generateNumericalDistractors(correctNumber);
        const options = shuffleArray([correctNumber, ...distractors]);
        const correctIndex = options.indexOf(correctNumber);

        questions.push({
          id: `quiz-${questionId++}`,
          question: `According to the document: ${contextQuestion}`,
          options,
          correctAnswer: correctIndex,
          explanation: `The correct answer is ${correctNumber}. Full context: ${fact.fact}`
        });
      }
    });

  console.log(`✅ Generated ${questions.length} semantically relevant quiz questions`);
  return questions;
};

function performSemanticAnalysis(content: string): SemanticContent {
  console.log('📊 Performing deep semantic analysis...');
  
  // Clean and prepare content
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,;:!?()-]/g, '')
    .trim();

  // Split into meaningful sentences
  const sentences = cleanContent
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 400)
    .filter(s => !isMetaContent(s));

  console.log(`📝 Analyzing ${sentences.length} meaningful sentences`);

  const semanticContent: SemanticContent = {
    definitions: [],
    concepts: [],
    facts: [],
    processes: [],
    principles: []
  };

  sentences.forEach(sentence => {
    // Extract definitions with semantic understanding
    extractDefinitions(sentence, semanticContent.definitions);
    
    // Extract concepts and theories
    extractConcepts(sentence, semanticContent.concepts);
    
    // Extract factual information
    extractFacts(sentence, semanticContent.facts);
    
    // Extract processes and procedures
    extractProcesses(sentence, semanticContent.processes);
    
    // Extract principles and rules
    extractPrinciples(sentence, semanticContent.principles);
  });

  // Sort by importance and remove duplicates
  semanticContent.definitions = removeDuplicates(semanticContent.definitions, 'term').sort((a, b) => b.importance - a.importance);
  semanticContent.concepts = removeDuplicates(semanticContent.concepts, 'concept');
  semanticContent.facts = removeDuplicates(semanticContent.facts, 'fact').sort((a, b) => b.importance - a.importance);
  semanticContent.processes = removeDuplicates(semanticContent.processes, 'name');
  semanticContent.principles = removeDuplicates(semanticContent.principles, 'principle').sort((a, b) => b.importance - a.importance);

  console.log(`📊 Semantic analysis complete:`);
  console.log(`  📚 Definitions: ${semanticContent.definitions.length}`);
  console.log(`  💡 Concepts: ${semanticContent.concepts.length}`);
  console.log(`  📈 Facts: ${semanticContent.facts.length}`);
  console.log(`  📋 Processes: ${semanticContent.processes.length}`);
  console.log(`  ⚖️ Principles: ${semanticContent.principles.length}`);

  return semanticContent;
}

function extractDefinitions(sentence: string, definitions: any[]) {
  const patterns = [
    // "X is Y" - most reliable
    /^([A-Z][a-zA-Z\s]{2,50})\s+is\s+([^,]{20,200})(?:\.|,|$)/i,
    // "X refers to Y"
    /^([A-Z][a-zA-Z\s]{2,50})\s+refers?\s+to\s+([^,]{20,200})(?:\.|,|$)/i,
    // "X means Y"
    /^([A-Z][a-zA-Z\s]{2,50})\s+means?\s+([^,]{20,200})(?:\.|,|$)/i,
    // "X is defined as Y"
    /^([A-Z][a-zA-Z\s]{2,50})\s+is\s+defined\s+as\s+([^,]{20,200})(?:\.|,|$)/i,
    // "X, which is Y"
    /^([A-Z][a-zA-Z\s]{2,50}),\s+which\s+is\s+([^,]{20,200})(?:\.|,|$)/i
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const term = match[1].trim();
      const definition = match[2].trim();
      
      if (isValidTerm(term) && isValidDefinition(definition)) {
        const category = categorizeDefinition(term, definition);
        const importance = calculateDefinitionImportance(term, definition, sentence);
        
        definitions.push({
          term,
          definition,
          context: extractDefinitionContext(sentence, term),
          importance,
          category
        });
        break;
      }
    }
  }
}

function extractConcepts(sentence: string, concepts: any[]) {
  const patterns = [
    // "The concept of X involves Y"
    /(?:concept|theory|principle|approach|framework)\s+of\s+([a-zA-Z\s]{3,50})\s+(?:involves?|includes?|encompasses?|states?)\s+([^.]{30,300})/i,
    // "X theory suggests Y"
    /([A-Z][a-zA-Z\s]{3,50})\s+(?:theory|model|framework)\s+(?:suggests?|proposes?|states?|argues?)\s+that\s+([^.]{30,300})/i,
    // "According to X, Y"
    /According\s+to\s+([a-zA-Z\s]{3,50}),\s+([^.]{30,300})/i
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const concept = match[1].trim();
      const explanation = match[2].trim();
      
      if (isValidTerm(concept) && explanation.length > 20) {
        concepts.push({
          concept,
          explanation,
          significance: extractSignificance(sentence),
          examples: extractExamples(sentence),
          category: categorizeConcept(concept, explanation)
        });
        break;
      }
    }
  }
}

function extractFacts(sentence: string, facts: any[]) {
  let factType: 'numerical' | 'research' | 'historical' | 'statistical' = 'numerical';
  let importance = 5;

  // Numerical facts
  if (sentence.match(/\d+(?:\.\d+)?(?:%|percent|million|billion|thousand|years?|months?|days?|dollars?)/)) {
    factType = 'numerical';
    importance = 7;
  }
  
  // Research-based facts
  if (sentence.match(/(?:research|study|studies|data|evidence|findings?)\s+(?:shows?|indicates?|suggests?|reveals?|demonstrates?)/i)) {
    factType = 'research';
    importance = 8;
  }
  
  // Historical facts
  if (sentence.match(/(?:in\s+\d{4}|historically|in\s+the\s+past|previously|originally)/i)) {
    factType = 'historical';
    importance = 6;
  }
  
  // Statistical facts
  if (sentence.match(/(?:statistics?|data\s+shows?|survey|poll|analysis\s+reveals?)/i)) {
    factType = 'statistical';
    importance = 7;
  }

  if (importance >= 6) {
    facts.push({
      fact: sentence,
      context: sentence,
      type: factType,
      importance
    });
  }
}

function extractProcesses(sentence: string, processes: any[]) {
  const patterns = [
    // "The process of X involves Y"
    /(?:process|procedure|method|approach)\s+(?:of|for|to)\s+([a-zA-Z\s]{3,50})\s+(?:involves?|includes?|requires?|consists?\s+of)\s+([^.]{30,300})/i,
    // "To X, you must Y"
    /To\s+([a-zA-Z\s]{3,50}),\s+(?:you\s+must|one\s+must|it\s+is\s+necessary\s+to)\s+([^.]{30,300})/i,
    // "X can be achieved by Y"
    /([A-Z][a-zA-Z\s]{3,50})\s+can\s+be\s+(?:achieved|accomplished|done)\s+by\s+([^.]{30,300})/i
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const processName = match[1].trim();
      const stepsText = match[2].trim();
      const steps = extractSteps(stepsText);
      
      if (steps.length >= 2) {
        processes.push({
          name: processName,
          steps,
          purpose: extractPurpose(sentence),
          outcome: extractOutcome(sentence),
          category: categorizeProcess(processName)
        });
        break;
      }
    }
  }
}

function extractPrinciples(sentence: string, principles: any[]) {
  const patterns = [
    // "The principle of X states Y"
    /(?:principle|rule|law)\s+of\s+([a-zA-Z\s]{3,50})\s+(?:states?|dictates?|requires?)\s+that\s+([^.]{20,300})/i,
    // "X principle suggests Y"
    /([A-Z][a-zA-Z\s]{3,50})\s+principle\s+(?:suggests?|indicates?|states?)\s+([^.]{20,300})/i,
    // "It is important to X because Y"
    /It\s+is\s+(?:important|crucial|essential)\s+to\s+([a-zA-Z\s]{3,50})\s+because\s+([^.]{20,300})/i
  ];

  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) {
      const principle = match[1].trim();
      const explanation = match[2].trim();
      
      if (isValidTerm(principle)) {
        principles.push({
          principle,
          explanation,
          applications: extractApplications(sentence),
          importance: calculatePrincipleImportance(principle, explanation, sentence)
        });
        break;
      }
    }
  }
}

// Helper functions for semantic understanding
function isMetaContent(sentence: string): boolean {
  const metaPatterns = [
    /^(?:this|that|these|those|the\s+(?:document|text|paper|study|article))/i,
    /^(?:as\s+(?:mentioned|stated|discussed|shown|seen))/i,
    /^(?:figure|table|chart|graph|image|page|section|chapter)\s+\d+/i,
    /^(?:see|refer\s+to|according\s+to\s+(?:figure|table))/i
  ];
  
  return metaPatterns.some(pattern => pattern.test(sentence));
}

function isValidTerm(term: string): boolean {
  if (term.length < 3 || term.length > 60) return false;
  if (/^(?:this|that|these|those|it|they|the|a|an|and|or|but|in|on|at|to|for|of|with|by|document|text|paper)$/i.test(term)) return false;
  if (!/[A-Za-z]/.test(term)) return false;
  if (term.split(' ').length > 8) return false; // Too many words
  return true;
}

function isValidDefinition(definition: string): boolean {
  if (definition.length < 20 || definition.length > 400) return false;
  if (/^(?:this|that|these|those|it|they)$/i.test(definition.trim())) return false;
  if (definition.split(' ').length < 4) return false; // Too short
  return true;
}

function categorizeDefinition(term: string, definition: string): string {
  if (definition.match(/(?:theory|concept|principle|framework)/i)) return 'Theory';
  if (definition.match(/(?:process|method|procedure|technique)/i)) return 'Process';
  if (definition.match(/(?:system|structure|organization)/i)) return 'System';
  if (definition.match(/(?:tool|instrument|device|equipment)/i)) return 'Tool';
  if (definition.match(/(?:condition|state|situation|status)/i)) return 'Condition';
  return 'Definition';
}

function categorizeConcept(concept: string, explanation: string): string {
  if (explanation.match(/(?:theory|theoretical)/i)) return 'Theory';
  if (explanation.match(/(?:method|approach|technique)/i)) return 'Methodology';
  if (explanation.match(/(?:principle|rule|law)/i)) return 'Principle';
  if (explanation.match(/(?:model|framework|structure)/i)) return 'Framework';
  return 'Concept';
}

function categorizeProcess(processName: string): string {
  if (processName.match(/(?:analysis|analyzing|evaluation)/i)) return 'Analysis';
  if (processName.match(/(?:development|creating|building)/i)) return 'Development';
  if (processName.match(/(?:implementation|applying|execution)/i)) return 'Implementation';
  if (processName.match(/(?:management|organizing|planning)/i)) return 'Management';
  return 'Process';
}

function calculateDefinitionImportance(term: string, definition: string, sentence: string): number {
  let importance = 5;
  
  // Higher importance for clear definition patterns
  if (sentence.includes(' is ')) importance += 2;
  if (sentence.includes(' defined as ')) importance += 3;
  if (sentence.includes(' refers to ')) importance += 2;
  
  // Higher importance for substantial definitions
  if (definition.length > 50) importance += 1;
  if (definition.length > 100) importance += 1;
  
  // Higher importance for technical terms
  if (term.match(/[A-Z][a-z]+[A-Z]/)) importance += 1; // CamelCase
  if (definition.match(/(?:specifically|particularly|essentially|fundamentally)/i)) importance += 1;
  
  // Lower importance for vague terms
  if (term.includes('thing') || term.includes('stuff') || term.includes('item')) importance -= 2;
  if (definition.includes('something') || definition.includes('anything')) importance -= 1;
  
  return Math.min(9, Math.max(1, importance));
}

function calculatePrincipleImportance(principle: string, explanation: string, sentence: string): number {
  let importance = 5;
  
  if (sentence.includes('important') || sentence.includes('crucial')) importance += 2;
  if (sentence.includes('essential') || sentence.includes('fundamental')) importance += 3;
  if (explanation.length > 50) importance += 1;
  
  return Math.min(9, Math.max(1, importance));
}

function extractDefinitionContext(sentence: string, term: string): string {
  // Extract surrounding context that explains why this definition matters
  const contextPatterns = [
    new RegExp(`${term}[^.]*(?:because|since|as|due to)\\s+([^.]+)`, 'i'),
    new RegExp(`(?:This|It)\\s+is\\s+(?:important|significant|crucial)\\s+because\\s+([^.]+)`, 'i')
  ];
  
  for (const pattern of contextPatterns) {
    const match = sentence.match(pattern);
    if (match) return match[1].trim();
  }
  
  return '';
}

function extractSignificance(sentence: string): string {
  const significanceMatch = sentence.match(/(?:significant|important|crucial|essential)\\s+because\\s+([^.]+)/i);
  return significanceMatch ? significanceMatch[1].trim() : '';
}

function extractExamples(sentence: string): string[] {
  const exampleMatches = sentence.match(/(?:for example|such as|including|like)\\s+([^.]+)/i);
  if (exampleMatches) {
    return exampleMatches[1].split(/,|and/).map(ex => ex.trim()).filter(ex => ex.length > 2);
  }
  return [];
}

function extractSteps(stepsText: string): string[] {
  // Try numbered steps first
  const numberedSteps = stepsText.match(/\d+\.\s*([^.]+)/g);
  if (numberedSteps && numberedSteps.length > 1) {
    return numberedSteps.map(step => step.replace(/^\d+\.\s*/, '').trim());
  }
  
  // Try sequence words
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
  const purposeMatch = sentence.match(/(?:in order to|to|for the purpose of|aimed at)\\s+([^,.]+)/i);
  return purposeMatch ? purposeMatch[1].trim() : '';
}

function extractOutcome(sentence: string): string {
  const outcomeMatch = sentence.match(/(?:results? in|leads to|produces|achieves|outcomes?)\\s+([^,.]+)/i);
  return outcomeMatch ? outcomeMatch[1].trim() : '';
}

function extractApplications(sentence: string): string[] {
  const applicationMatch = sentence.match(/(?:applied to|used in|implemented in|utilized for)\\s+([^.]+)/i);
  if (applicationMatch) {
    return applicationMatch[1].split(/,|and/).map(app => app.trim()).filter(app => app.length > 2);
  }
  return [];
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !/^(?:the|and|or|but|in|on|at|to|for|of|with|by|from|this|that|these|those)$/.test(word))
    .slice(0, 5);
}

function removeDuplicates(items: any[], keyField: string): any[] {
  const seen = new Set();
  return items.filter(item => {
    const key = item[keyField].toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function generateSemanticDistractors(correctAnswer: string, allItems: any[], type: string): string[] {
  const distractors = allItems
    .filter(item => {
      const itemText = type === 'definition' ? item.definition : item.explanation;
      return itemText !== correctAnswer;
    })
    .map(item => type === 'definition' ? item.definition : item.explanation)
    .slice(0, 3);
  
  // Fill with contextually relevant generic distractors if needed
  const genericDistractors = {
    definition: [
      'A systematic approach to organizing and analyzing complex information',
      'A method used to evaluate and compare different options systematically',
      'A framework for understanding relationships between different elements'
    ],
    concept: [
      'A theoretical framework that provides structure for comprehensive analysis',
      'An approach that emphasizes systematic evaluation and comparison of alternatives',
      'A methodology that focuses on understanding complex relationships and patterns'
    ]
  };
  
  const relevantGenerics = genericDistractors[type as keyof typeof genericDistractors] || genericDistractors.definition;
  
  while (distractors.length < 3) {
    const generic = relevantGenerics[distractors.length];
    if (generic && !distractors.includes(generic)) {
      distractors.push(generic);
    } else {
      break;
    }
  }
  
  return distractors.slice(0, 3);
}

function generateProcessDistractors(correctSteps: string[], allProcesses: any[]): string[] {
  const distractors = allProcesses
    .filter(process => process.steps !== correctSteps)
    .map(process => process.steps.slice(0, 3).join(' → '))
    .slice(0, 3);
  
  // Fill with generic process distractors if needed
  const genericProcesses = [
    'Plan → Execute → Evaluate',
    'Analyze → Design → Implement',
    'Research → Develop → Test'
  ];
  
  while (distractors.length < 3) {
    const generic = genericProcesses[distractors.length];
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
    return ['25%', '50%', '75%'];
  }
  
  const variations = [
    Math.floor(baseNumber * 0.6) + unit,
    Math.floor(baseNumber * 1.4) + unit,
    Math.floor(baseNumber * 2.1) + unit
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