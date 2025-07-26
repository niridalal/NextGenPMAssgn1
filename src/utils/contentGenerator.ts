import { Flashcard, QuizQuestion } from '../types';

export const generateFlashcards = (text: string): Flashcard[] => {
  const flashcards: Flashcard[] = [];
  
  // Target count based on content length
  const targetCount = Math.min(Math.max(10, Math.floor(text.length / 800)), 25);
  
  // Clean and prepare text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 40);
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 100);
  
  // Enhanced extraction functions
  const definitions = extractDefinitions(cleanText);
  const keyTerms = extractKeyTerms(cleanText);
  const processes = extractProcesses(cleanText);
  const concepts = extractConcepts(cleanText);
  const relationships = extractRelationships(cleanText);
  const examples = extractExamples(cleanText);
  const principles = extractPrinciples(cleanText);
  const comparisons = extractComparisons(cleanText);
  
  // Generate definition flashcards (high priority)
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
  
  // Generate concept explanation flashcards
  concepts.forEach((concept, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `Explain the concept of ${concept.name}`,
        answer: concept.explanation,
        category: 'Concept'
      });
    }
  });
  
  // Generate process flashcards
  processes.forEach((process, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `How does ${process.name} work?`,
        answer: process.description,
        category: 'Process'
      });
    }
  });
  
  // Generate relationship flashcards
  relationships.forEach((rel, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `What is the relationship between ${rel.entity1} and ${rel.entity2}?`,
        answer: rel.relationship,
        category: 'Relationship'
      });
    }
  });
  
  // Generate example-based flashcards
  examples.forEach((example, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `Provide an example of ${example.concept}`,
        answer: example.example,
        category: 'Example'
      });
    }
  });
  
  // Generate principle flashcards
  principles.forEach((principle, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `What is the principle behind ${principle.topic}?`,
        answer: principle.principle,
        category: 'Principle'
      });
    }
  });
  
  // Generate comparison flashcards
  comparisons.forEach((comp, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `Compare and contrast ${comp.item1} and ${comp.item2}`,
        answer: comp.comparison,
        category: 'Comparison'
      });
    }
  });
  
  // Generate key term flashcards
  keyTerms.forEach((term, index) => {
    if (flashcards.length < targetCount) {
      flashcards.push({
        id: flashcards.length + 1,
        question: `What is the significance of "${term.term}" in this context?`,
        answer: term.context,
        category: 'Key Term'
      });
    }
  });
  
  return flashcards.slice(0, targetCount);
};

export const generateQuizQuestions = (text: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Target count based on content length
  const targetCount = Math.min(Math.max(8, Math.floor(text.length / 1000)), 20);
  
  // Extract different types of content for quiz questions
  const definitions = extractDefinitions(cleanText);
  const concepts = extractConcepts(cleanText);
  const processes = extractProcesses(cleanText);
  const facts = extractFactualStatements(cleanText);
  const relationships = extractRelationships(cleanText);
  const principles = extractPrinciples(cleanText);
  const comparisons = extractComparisons(cleanText);
  const applications = extractApplications(cleanText);
  
  // Generate definition-based questions
  definitions.forEach((def, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateDefinitionDistractors(def.definition, definitions);
      const options = shuffleArray([def.definition, ...incorrectOptions]);
      const correctAnswer = options.indexOf(def.definition);
      
      questions.push({
        id: questions.length + 1,
        question: `Which of the following best defines "${def.term}"?`,
        options,
        correctAnswer,
        explanation: `${def.term} is correctly defined as: ${def.definition}. This definition captures the essential characteristics and distinguishes it from related concepts.`
      });
    }
  });
  
  // Generate concept understanding questions
  concepts.forEach((concept, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateConceptDistractors(concept.explanation, concepts);
      const options = shuffleArray([concept.explanation, ...incorrectOptions]);
      const correctAnswer = options.indexOf(concept.explanation);
      
      questions.push({
        id: questions.length + 1,
        question: `What is the main idea behind ${concept.name}?`,
        options,
        correctAnswer,
        explanation: `The concept of ${concept.name} is best understood as: ${concept.explanation}. This explanation highlights the core principles and practical implications.`
      });
    }
  });
  
  // Generate process-based questions
  processes.forEach((process, index) => {
    if (questions.length < targetCount) {
      const steps = extractProcessSteps(process.description);
      if (steps.length >= 2) {
        const correctStep = steps[0];
        const incorrectOptions = generateProcessDistractors(correctStep, steps, processes);
        const options = shuffleArray([correctStep, ...incorrectOptions]);
        const correctAnswer = options.indexOf(correctStep);
        
        questions.push({
          id: questions.length + 1,
          question: `What is the first step in ${process.name}?`,
          options,
          correctAnswer,
          explanation: `The process of ${process.name} begins with: ${correctStep}. This initial step is crucial because it establishes the foundation for subsequent actions.`
        });
      }
    }
  });
  
  // Generate relationship questions
  relationships.forEach((rel, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateRelationshipDistractors(rel.relationship, relationships);
      const options = shuffleArray([rel.relationship, ...incorrectOptions]);
      const correctAnswer = options.indexOf(rel.relationship);
      
      questions.push({
        id: questions.length + 1,
        question: `How are ${rel.entity1} and ${rel.entity2} related?`,
        options,
        correctAnswer,
        explanation: `The relationship between ${rel.entity1} and ${rel.entity2} is: ${rel.relationship}. Understanding this connection is important for grasping the broader context.`
      });
    }
  });
  
  // Generate application questions
  applications.forEach((app, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateApplicationDistractors(app.application, applications);
      const options = shuffleArray([app.application, ...incorrectOptions]);
      const correctAnswer = options.indexOf(app.application);
      
      questions.push({
        id: questions.length + 1,
        question: `How can ${app.concept} be applied in practice?`,
        options,
        correctAnswer,
        explanation: `${app.concept} can be practically applied through: ${app.application}. This application demonstrates the real-world relevance and utility of the concept.`
      });
    }
  });
  
  // Generate principle-based questions
  principles.forEach((principle, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generatePrincipleDistractors(principle.principle, principles);
      const options = shuffleArray([principle.principle, ...incorrectOptions]);
      const correctAnswer = options.indexOf(principle.principle);
      
      questions.push({
        id: questions.length + 1,
        question: `What principle governs ${principle.topic}?`,
        options,
        correctAnswer,
        explanation: `The governing principle for ${principle.topic} is: ${principle.principle}. This principle provides the theoretical foundation and guides practical implementation.`
      });
    }
  });
  
  // Generate comparison questions
  comparisons.forEach((comp, index) => {
    if (questions.length < targetCount) {
      const incorrectOptions = generateComparisonDistractors(comp.comparison, comparisons);
      const options = shuffleArray([comp.comparison, ...incorrectOptions]);
      const correctAnswer = options.indexOf(comp.comparison);
      
      questions.push({
        id: questions.length + 1,
        question: `What is the key difference between ${comp.item1} and ${comp.item2}?`,
        options,
        correctAnswer,
        explanation: `The key difference is: ${comp.comparison}. This distinction is important for understanding when and how to apply each concept appropriately.`
      });
    }
  });
  
  return questions.slice(0, targetCount);
};

// Enhanced extraction functions with better pattern recognition

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
    /(.+?)\s+involves\s+(.+)/i,
    /(.+?)\s+consists\s+of\s+(.+)/i,
    /(.+?)\s+encompasses\s+(.+)/i,
    /(.+?)\s+denotes\s+(.+)/i,
    /(.+?)\s+signifies\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of definitionPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const term = match[1].trim().replace(/^(The|A|An)\s+/i, '');
        const definition = match[2].trim();
        
        if (term.length > 2 && term.length < 80 && 
            definition.length > 20 && definition.length < 400 &&
            !term.includes('this') && !term.includes('that') &&
            !definition.toLowerCase().includes('undefined') &&
            !isGenericTerm(term)) {
          definitions.push({ term, definition });
          break;
        }
      }
    }
  });
  
  return definitions.slice(0, 12);
};

const extractConcepts = (text: string): { name: string; explanation: string }[] => {
  const concepts: { name: string; explanation: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const conceptPatterns = [
    /The\s+concept\s+of\s+(.+?)\s+(.+)/i,
    /(.+?)\s+concept\s+(.+)/i,
    /(.+?)\s+theory\s+(.+)/i,
    /(.+?)\s+principle\s+(.+)/i,
    /(.+?)\s+approach\s+(.+)/i,
    /(.+?)\s+methodology\s+(.+)/i,
    /(.+?)\s+framework\s+(.+)/i,
    /(.+?)\s+model\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of conceptPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const name = match[1].trim();
        const explanation = match[2].trim();
        
        if (name.length > 3 && name.length < 60 && 
            explanation.length > 25 && explanation.length < 300 &&
            !isGenericTerm(name)) {
          concepts.push({ name, explanation });
          break;
        }
      }
    }
  });
  
  return concepts.slice(0, 8);
};

const extractProcesses = (text: string): { name: string; description: string }[] => {
  const processes: { name: string; description: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const processPatterns = [
    /(.+?)\s+process\s+(?:involves|includes|consists of|requires|begins with)\s+(.+)/i,
    /(?:The|A)\s+(.+?)\s+method\s+(.+)/i,
    /(?:To|In order to)\s+(.+?),\s+(.+)/i,
    /(.+?)\s+procedure\s+(.+)/i,
    /(.+?)\s+algorithm\s+(.+)/i,
    /(.+?)\s+workflow\s+(.+)/i,
    /(.+?)\s+sequence\s+(.+)/i,
    /(.+?)\s+steps\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of processPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const name = match[1].trim();
        const description = match[2].trim();
        
        if (name.length > 5 && name.length < 80 && 
            description.length > 30 && description.length < 500) {
          processes.push({ name, description });
          break;
        }
      }
    }
  });
  
  return processes.slice(0, 6);
};

const extractRelationships = (text: string): { entity1: string; entity2: string; relationship: string }[] => {
  const relationships: { entity1: string; entity2: string; relationship: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const relationshipPatterns = [
    /(.+?)\s+(?:affects|influences|impacts|determines)\s+(.+?)\s+(?:by|through|via)\s+(.+)/i,
    /(.+?)\s+(?:relates to|connects to|links to)\s+(.+?)\s+(?:through|via|by)\s+(.+)/i,
    /(.+?)\s+and\s+(.+?)\s+(?:are related|interact|work together)\s+(.+)/i,
    /(?:The relationship between|The connection between)\s+(.+?)\s+and\s+(.+?)\s+(?:is|involves)\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of relationshipPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        const entity1 = match[1].trim();
        const entity2 = match[2].trim();
        const relationship = match[3].trim();
        
        if (entity1.length > 3 && entity1.length < 60 && 
            entity2.length > 3 && entity2.length < 60 &&
            relationship.length > 15 && relationship.length < 200) {
          relationships.push({ entity1, entity2, relationship });
          break;
        }
      }
    }
  });
  
  return relationships.slice(0, 5);
};

const extractExamples = (text: string): { concept: string; example: string }[] => {
  const examples: { concept: string; example: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const examplePatterns = [
    /(?:For example|For instance),\s+(.+)/i,
    /(.+?)\s+(?:such as|including|like)\s+(.+)/i,
    /(?:An example of|Examples of)\s+(.+?)\s+(?:is|are|include)\s+(.+)/i,
    /(.+?)\s+can be illustrated by\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of examplePatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const concept = match[1].trim();
        const example = match[2].trim();
        
        if (concept.length > 5 && concept.length < 80 && 
            example.length > 15 && example.length < 300) {
          examples.push({ concept, example });
          break;
        }
      }
    }
  });
  
  return examples.slice(0, 4);
};

const extractPrinciples = (text: string): { topic: string; principle: string }[] => {
  const principles: { topic: string; principle: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const principlePatterns = [
    /(?:The principle of|The law of|The rule of)\s+(.+?)\s+(?:states|dictates|requires)\s+(.+)/i,
    /(.+?)\s+(?:is governed by|follows|adheres to)\s+(?:the principle|the law|the rule)\s+(.+)/i,
    /(?:According to|Based on)\s+(.+?),\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of principlePatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const topic = match[1].trim();
        const principle = match[2].trim();
        
        if (topic.length > 5 && topic.length < 80 && 
            principle.length > 20 && principle.length < 300) {
          principles.push({ topic, principle });
          break;
        }
      }
    }
  });
  
  return principles.slice(0, 4);
};

const extractComparisons = (text: string): { item1: string; item2: string; comparison: string }[] => {
  const comparisons: { item1: string; item2: string; comparison: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const comparisonPatterns = [
    /(.+?)\s+(?:differs from|is different from|contrasts with)\s+(.+?)\s+(?:in that|because)\s+(.+)/i,
    /(?:Unlike|In contrast to)\s+(.+?),\s+(.+?)\s+(.+)/i,
    /(.+?)\s+(?:while|whereas)\s+(.+?)\s+(.+)/i,
    /(.+?)\s+and\s+(.+?)\s+(?:differ|vary)\s+(?:in|by)\s+(.+)/i,
    /(?:The difference between|The distinction between)\s+(.+?)\s+and\s+(.+?)\s+(?:is|lies in)\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of comparisonPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        const item1 = match[1].trim();
        const item2 = match[2].trim();
        const comparison = match[3].trim();
        
        if (item1.length > 3 && item2.length > 3 && comparison.length > 15) {
          comparisons.push({ item1, item2, comparison });
          break;
        }
      }
    }
  });
  
  return comparisons.slice(0, 3);
};

const extractApplications = (text: string): { concept: string; application: string }[] => {
  const applications: { concept: string; application: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  const applicationPatterns = [
    /(.+?)\s+(?:can be applied|is applied|is used)\s+(?:in|for|to)\s+(.+)/i,
    /(?:Applications of|Uses of)\s+(.+?)\s+include\s+(.+)/i,
    /(.+?)\s+(?:is useful for|helps with|enables)\s+(.+)/i,
    /(?:In practice|Practically),\s+(.+?)\s+(.+)/i
  ];
  
  sentences.forEach(sentence => {
    for (const pattern of applicationPatterns) {
      const match = sentence.match(pattern);
      if (match && match[1] && match[2]) {
        const concept = match[1].trim();
        const application = match[2].trim();
        
        if (concept.length > 5 && concept.length < 80 && 
            application.length > 15 && application.length < 300) {
          applications.push({ concept, application });
          break;
        }
      }
    }
  });
  
  return applications.slice(0, 4);
};

const extractKeyTerms = (text: string): { term: string; context: string }[] => {
  const terms: { term: string; context: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  // Look for capitalized terms, technical terms, and quoted terms
  const technicalPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    /\b([a-z]+(?:tion|sion|ment|ness|ity|ism|ology|graphy|ics|ing))\b/gi,
    /"([^"]+)"/g,
    /\*([^*]+)\*/g,
    /\b([A-Z]{2,})\b/g
  ];
  
  sentences.forEach(sentence => {
    if (sentence.length > 50) {
      technicalPatterns.forEach(pattern => {
        const matches = sentence.matchAll(pattern);
        for (const match of matches) {
          const term = match[1];
          if (term && term.length > 3 && term.length < 50 && !isGenericTerm(term)) {
            const context = sentence.trim().substring(0, 250);
            if (context.length > 40) {
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
  
  return uniqueTerms.slice(0, 8);
};

const extractFactualStatements = (text: string): { question: string; answer: string }[] => {
  const facts: { question: string; answer: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 50 && trimmed.length < 250) {
      // Look for factual statements with specific patterns
      const factPatterns = [
        /(.+?)\s+(?:was|were)\s+(.+)/i,
        /(.+?)\s+(?:has|have)\s+(.+)/i,
        /(.+?)\s+(?:contains|includes)\s+(.+)/i,
        /(.+?)\s+(?:consists of|comprises)\s+(.+)/i,
        /(.+?)\s+(?:shows|demonstrates|indicates)\s+(.+)/i,
        /(.+?)\s+(?:results in|leads to|causes)\s+(.+)/i
      ];
      
      for (const pattern of factPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1] && match[2]) {
          const subject = match[1].trim();
          const predicate = match[2].trim();
          
          if (subject.length > 5 && predicate.length > 10 && !isGenericTerm(subject)) {
            const verb = match[0].includes('was') ? 'was' : 
                        match[0].includes('were') ? 'were' : 
                        match[0].includes('has') ? 'has' : 
                        match[0].includes('have') ? 'have' : 
                        match[0].includes('contains') ? 'contains' : 
                        match[0].includes('includes') ? 'includes' : 
                        match[0].includes('consists') ? 'consists of' : 
                        match[0].includes('comprises') ? 'comprises' :
                        match[0].includes('shows') ? 'shows' :
                        match[0].includes('demonstrates') ? 'demonstrates' :
                        match[0].includes('indicates') ? 'indicates' :
                        match[0].includes('results') ? 'results in' :
                        match[0].includes('leads') ? 'leads to' : 'causes';
            
            facts.push({
              question: `What ${verb} ${subject}?`,
              answer: `${subject} ${verb} ${predicate}`
            });
            break;
          }
        }
      }
    }
  });
  
  return facts.slice(0, 8);
};

// Enhanced distractor generation functions

const generateDefinitionDistractors = (correctAnswer: string, allDefinitions: { term: string; definition: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other definitions as distractors
  const otherDefinitions = allDefinitions
    .filter(def => def.definition !== correctAnswer)
    .map(def => def.definition)
    .slice(0, 2);
  
  options.push(...otherDefinitions);
  
  // Generate plausible but incorrect variations
  if (options.length < 3) {
    const words = correctAnswer.split(' ');
    if (words.length > 6) {
      // Create variations by changing key terms
      const variation1 = words.map((word, index) => {
        if (index === Math.floor(words.length / 3)) {
          return getAlternativeWord(word);
        }
        return word;
      }).join(' ');
      
      const variation2 = words.map((word, index) => {
        if (index === Math.floor(words.length * 2 / 3)) {
          return getAlternativeWord(word);
        }
        return word;
      }).join(' ');
      
      options.push(variation1, variation2);
    }
  }
  
  // Add generic distractors if needed
  while (options.length < 3) {
    const genericOptions = [
      'A systematic approach to organizing and managing complex information structures',
      'A methodological framework for analyzing and interpreting data patterns',
      'A comprehensive strategy for optimizing performance and efficiency metrics',
      'A theoretical model for understanding relationships between variables'
    ];
    
    const randomOption = genericOptions[Math.floor(Math.random() * genericOptions.length)];
    if (!options.includes(randomOption)) {
      options.push(randomOption);
    }
  }
  
  return options.slice(0, 3);
};

const generateConceptDistractors = (correctAnswer: string, allConcepts: { name: string; explanation: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other concept explanations
  const otherExplanations = allConcepts
    .filter(concept => concept.explanation !== correctAnswer)
    .map(concept => concept.explanation)
    .slice(0, 2);
  
  options.push(...otherExplanations);
  
  // Generate conceptual variations
  while (options.length < 3) {
    const conceptualDistractors = [
      'A fundamental principle that governs the interaction between different system components',
      'An abstract framework that provides structure for understanding complex relationships',
      'A theoretical construct that explains the underlying mechanisms of observed phenomena',
      'A conceptual model that integrates multiple perspectives into a unified understanding'
    ];
    
    const randomDistractor = conceptualDistractors[Math.floor(Math.random() * conceptualDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

const generateProcessDistractors = (correctStep: string, allSteps: string[], allProcesses: { name: string; description: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other steps as distractors
  const otherSteps = allSteps.filter(step => step !== correctStep).slice(0, 1);
  options.push(...otherSteps);
  
  // Use steps from other processes
  allProcesses.forEach(process => {
    const steps = extractProcessSteps(process.description);
    steps.forEach(step => {
      if (step !== correctStep && options.length < 2) {
        options.push(step);
      }
    });
  });
  
  // Generate plausible process steps
  while (options.length < 3) {
    const processDistractors = [
      'Establish initial parameters and configure system settings',
      'Validate input data and perform preliminary checks',
      'Execute primary algorithms and process core functions',
      'Generate output results and perform quality assurance',
      'Document findings and prepare final reports'
    ];
    
    const randomDistractor = processDistractors[Math.floor(Math.random() * processDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

const generateRelationshipDistractors = (correctRelationship: string, allRelationships: { entity1: string; entity2: string; relationship: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other relationships as distractors
  const otherRelationships = allRelationships
    .filter(rel => rel.relationship !== correctRelationship)
    .map(rel => rel.relationship)
    .slice(0, 2);
  
  options.push(...otherRelationships);
  
  // Generate relationship variations
  while (options.length < 3) {
    const relationshipDistractors = [
      'They operate independently without any significant interaction or influence',
      'They have a complementary relationship that enhances mutual effectiveness',
      'They compete for the same resources and often conflict with each other',
      'They form a hierarchical structure with clear dependencies and control mechanisms'
    ];
    
    const randomDistractor = relationshipDistractors[Math.floor(Math.random() * relationshipDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

const generateApplicationDistractors = (correctApplication: string, allApplications: { concept: string; application: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other applications as distractors
  const otherApplications = allApplications
    .filter(app => app.application !== correctApplication)
    .map(app => app.application)
    .slice(0, 2);
  
  options.push(...otherApplications);
  
  // Generate application variations
  while (options.length < 3) {
    const applicationDistractors = [
      'Primarily used for theoretical research and academic study purposes',
      'Applied in specialized industrial processes requiring precise control',
      'Implemented in educational settings to enhance learning outcomes',
      'Utilized in healthcare systems for diagnostic and treatment purposes'
    ];
    
    const randomDistractor = applicationDistractors[Math.floor(Math.random() * applicationDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

const generatePrincipleDistractors = (correctPrinciple: string, allPrinciples: { topic: string; principle: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other principles as distractors
  const otherPrinciples = allPrinciples
    .filter(prin => prin.principle !== correctPrinciple)
    .map(prin => prin.principle)
    .slice(0, 2);
  
  options.push(...otherPrinciples);
  
  // Generate principle variations
  while (options.length < 3) {
    const principleDistractors = [
      'The principle of maximum efficiency through resource optimization',
      'The principle of balanced integration across multiple system levels',
      'The principle of adaptive response to changing environmental conditions',
      'The principle of sustainable development through controlled growth'
    ];
    
    const randomDistractor = principleDistractors[Math.floor(Math.random() * principleDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

const generateComparisonDistractors = (correctComparison: string, allComparisons: { item1: string; item2: string; comparison: string }[]): string[] => {
  const options: string[] = [];
  
  // Use other comparisons as distractors
  const otherComparisons = allComparisons
    .filter(comp => comp.comparison !== correctComparison)
    .map(comp => comp.comparison)
    .slice(0, 2);
  
  options.push(...otherComparisons);
  
  // Generate comparison variations
  while (options.length < 3) {
    const comparisonDistractors = [
      'They are essentially identical in function but differ in implementation approach',
      'They serve completely different purposes and cannot be meaningfully compared',
      'They represent opposite extremes of the same underlying concept or principle',
      'They complement each other and work best when used in combination'
    ];
    
    const randomDistractor = comparisonDistractors[Math.floor(Math.random() * comparisonDistractors.length)];
    if (!options.includes(randomDistractor)) {
      options.push(randomDistractor);
    }
  }
  
  return options.slice(0, 3);
};

// Helper functions

const extractProcessSteps = (description: string): string[] => {
  const steps: string[] = [];
  
  // Look for numbered steps
  const numberedSteps = description.match(/\d+\.\s*([^.]+)/g);
  if (numberedSteps) {
    steps.push(...numberedSteps.map(step => step.replace(/\d+\.\s*/, '').trim()));
  }
  
  // Look for sequential indicators
  const sequentialPatterns = [
    /(?:first|initially|to begin),?\s*([^,;.]+)/gi,
    /(?:then|next|subsequently),?\s*([^,;.]+)/gi,
    /(?:finally|lastly|ultimately),?\s*([^,;.]+)/gi
  ];
  
  sequentialPatterns.forEach(pattern => {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 10) {
        steps.push(match[1].trim());
      }
    }
  });
  
  // Split by common delimiters if no structured steps found
  if (steps.length === 0) {
    const splitSteps = description.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 15);
    steps.push(...splitSteps.slice(0, 4));
  }
  
  return steps.slice(0, 5);
};

const isGenericTerm = (term: string): boolean => {
  const genericTerms = [
    'this', 'that', 'these', 'those', 'it', 'they', 'them', 'here', 'there',
    'something', 'anything', 'everything', 'nothing', 'someone', 'anyone',
    'everyone', 'thing', 'things', 'way', 'ways', 'time', 'times', 'place',
    'places', 'people', 'person', 'part', 'parts', 'system', 'systems',
    'method', 'methods', 'process', 'processes', 'approach', 'approaches'
  ];
  
  return genericTerms.includes(term.toLowerCase()) || 
         term.length < 3 || 
         /^\d+$/.test(term) ||
         /^[A-Z]+$/.test(term) && term.length < 4;
};

const getAlternativeWord = (word: string): string => {
  const alternatives: { [key: string]: string[] } = {
    'system': ['framework', 'structure', 'mechanism', 'approach'],
    'process': ['procedure', 'method', 'technique', 'workflow'],
    'method': ['approach', 'technique', 'procedure', 'strategy'],
    'approach': ['method', 'strategy', 'technique', 'way'],
    'technique': ['method', 'approach', 'procedure', 'strategy'],
    'strategy': ['approach', 'method', 'plan', 'technique'],
    'framework': ['structure', 'system', 'model', 'approach'],
    'structure': ['framework', 'system', 'organization', 'arrangement'],
    'model': ['framework', 'system', 'structure', 'template'],
    'concept': ['idea', 'notion', 'principle', 'theory'],
    'principle': ['concept', 'rule', 'law', 'guideline'],
    'theory': ['concept', 'principle', 'hypothesis', 'model'],
    'analysis': ['examination', 'evaluation', 'assessment', 'study'],
    'evaluation': ['assessment', 'analysis', 'examination', 'review'],
    'assessment': ['evaluation', 'analysis', 'examination', 'appraisal'],
    'implementation': ['execution', 'application', 'deployment', 'realization'],
    'application': ['implementation', 'use', 'utilization', 'employment'],
    'development': ['creation', 'formation', 'evolution', 'growth'],
    'management': ['administration', 'control', 'supervision', 'governance'],
    'organization': ['structure', 'arrangement', 'system', 'framework'],
    'performance': ['effectiveness', 'efficiency', 'productivity', 'output'],
    'effectiveness': ['efficiency', 'performance', 'success', 'impact'],
    'efficiency': ['effectiveness', 'productivity', 'performance', 'optimization']
  };
  
  const wordLower = word.toLowerCase();
  if (alternatives[wordLower]) {
    const alts = alternatives[wordLower];
    return alts[Math.floor(Math.random() * alts.length)];
  }
  
  return word;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};