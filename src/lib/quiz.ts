/**
 * src/lib/quiz.ts
 *
 * Pet care knowledge quiz used during sitter application.
 * Questions + correct answers live here — scoring is always server-side.
 * 20 questions, 70% pass mark, 7-day retry cooldown.
 */

export type QuizQuestion = {
  id: number
  question: string
  options: string[]
  correctIndex: number // Used for server-side scoring in the API route
  category: "body_language" | "first_aid" | "feeding" | "emergency" | "handling"
}

export const PASS_MARK = 70 // percent (≥70% = pass)
export const TOTAL_QUESTIONS = 20
export const QUIZ_COOLDOWN_DAYS = 7

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ─── Body Language ───────────────────────────────────────────────────────────
  {
    id: 1,
    question:
      "A dog holds its tail low and its ears flat against its head. What is this dog most likely communicating?",
    options: [
      "Excitement and happiness",
      "Submission or anxiety",
      "Territorial aggression",
      "Readiness to play",
    ],
    correctIndex: 1,
    category: "body_language",
  },
  {
    id: 2,
    question: "A cat approaches you with its tail held straight up. What does this signal?",
    options: ["Aggression", "Fear", "A friendly greeting", "The cat wants to be left alone"],
    correctIndex: 2,
    category: "body_language",
  },
  {
    id: 3,
    question:
      "A dog repeatedly yawns, licks its lips, and turns its head away during interaction. What does this typically mean?",
    options: [
      "The dog wants more play",
      "The dog is hungry",
      "The dog is showing stress or discomfort",
      "The dog is tired and ready to sleep",
    ],
    correctIndex: 2,
    category: "body_language",
  },
  {
    id: 4,
    question: "A cat slow-blinks at you. What is the best response to build trust?",
    options: [
      "Stare back intensely to show dominance",
      "Slow-blink back at the cat",
      "Look away quickly to avoid confrontation",
      "Approach the cat immediately",
    ],
    correctIndex: 1,
    category: "body_language",
  },
  {
    id: 5,
    question: "Which of these is a clear stress signal in dogs?",
    options: [
      "Tail wagging loosely at mid-height",
      "Relaxed body with a playful bounce",
      "'Whale eye' — the whites of the eyes are visible",
      "Ears in a relaxed, natural position",
    ],
    correctIndex: 2,
    category: "body_language",
  },

  // ─── First Aid ───────────────────────────────────────────────────────────────
  {
    id: 6,
    question:
      "A dog has eaten a large bar of dark chocolate. What is the MOST important first step?",
    options: [
      "Give the dog milk and water to dilute it",
      "Call a vet immediately — chocolate is toxic to dogs",
      "Wait to see if symptoms develop",
      "Give the dog bread to absorb the chocolate",
    ],
    correctIndex: 1,
    category: "first_aid",
  },
  {
    id: 7,
    question:
      "While caring for a pet, you notice it is unconscious and not breathing. What should you do?",
    options: [
      "Give the pet food and water to revive it",
      "Begin pet CPR and rush to an emergency vet immediately",
      "Place the pet in a warm bath",
      "Leave the pet in a quiet place to rest",
    ],
    correctIndex: 1,
    category: "first_aid",
  },
  {
    id: 8,
    question:
      "A dog has been stung by a bee and its face is swelling rapidly. What should you do?",
    options: [
      "Apply ice and monitor at home",
      "Remove the stinger and call a vet immediately — this could be anaphylaxis",
      "Give the dog antihistamines from your medicine cabinet",
      "Offer the dog water and let it rest",
    ],
    correctIndex: 1,
    category: "first_aid",
  },
  {
    id: 9,
    question: "A cat has licked antifreeze from a puddle. What should you do?",
    options: [
      "Give the cat milk to neutralise it",
      "Rush to an emergency vet immediately — antifreeze is rapidly fatal to cats",
      "Wash the cat's mouth with water and observe",
      "Wait to see if symptoms appear",
    ],
    correctIndex: 1,
    category: "first_aid",
  },

  // ─── Feeding ─────────────────────────────────────────────────────────────────
  {
    id: 10,
    question: "How often should a healthy adult dog (1–7 years) typically be fed?",
    options: ["Once a week", "Once every two days", "Twice a day", "Five times a day"],
    correctIndex: 2,
    category: "feeding",
  },
  {
    id: 11,
    question: "Which of these foods is TOXIC to dogs?",
    options: ["Plain boiled chicken", "Brown rice", "Grapes and raisins", "Carrots"],
    correctIndex: 2,
    category: "feeding",
  },
  {
    id: 12,
    question: "Which food is toxic to cats?",
    options: [
      "Plain cooked fish (boneless)",
      "Plain boiled rice",
      "Onions and garlic",
      "Plain cooked turkey",
    ],
    correctIndex: 2,
    category: "feeding",
  },
  {
    id: 13,
    question: "You are sitting a dog and it hasn't eaten its food for one full day. What do you do?",
    options: [
      "Force-feed the dog",
      "Add spices to make the food more appealing",
      "Notify the pet parent and monitor — contact a vet if the dog also seems lethargic or unwell",
      "Ignore it — dogs often skip meals",
    ],
    correctIndex: 2,
    category: "feeding",
  },

  // ─── Emergency ───────────────────────────────────────────────────────────────
  {
    id: 14,
    question:
      "A dog has been outside in summer heat and is panting heavily, drooling excessively, and seems disoriented. What is the likely problem?",
    options: [
      "The dog is just thirsty",
      "Normal summer behaviour for dogs",
      "Heatstroke — a medical emergency",
      "The dog needs more exercise",
    ],
    correctIndex: 2,
    category: "emergency",
  },
  {
    id: 15,
    question:
      "A large dog has a distended, rock-hard belly and is repeatedly retching without producing vomit. What could this indicate?",
    options: [
      "The dog is simply hungry",
      "Bloat (GDV) — a life-threatening emergency requiring immediate vet care",
      "The dog needs more exercise",
      "Mild dehydration",
    ],
    correctIndex: 1,
    category: "emergency",
  },
  {
    id: 16,
    question: "Which of these signs requires IMMEDIATE emergency vet attention?",
    options: [
      "The pet sneezed twice",
      "The pet is eating slightly less than usual",
      "The pet is having a seizure",
      "The pet sleeps slightly more than usual",
    ],
    correctIndex: 2,
    category: "emergency",
  },
  {
    id: 17,
    question: "A dog is having a seizure. What should you do?",
    options: [
      "Hold the dog still to prevent it from hurting itself",
      "Put something in the dog's mouth to prevent biting",
      "Keep the area clear of objects, time the seizure, stay calm, and call a vet",
      "Give the dog water immediately after the seizure ends",
    ],
    correctIndex: 2,
    category: "emergency",
  },

  // ─── Handling ────────────────────────────────────────────────────────────────
  {
    id: 18,
    question: "Two dogs in your care start fighting. What is the SAFEST way to break them up?",
    options: [
      "Grab both dogs by their collars",
      "Shout loudly and use a loud noise (clap, whistle) to startle them",
      "Put your hand between their mouths",
      "Pull them apart by their tails",
    ],
    correctIndex: 1,
    category: "handling",
  },
  {
    id: 19,
    question: "You encounter an unfamiliar dog. What is the safest way to approach?",
    options: [
      "Reach out quickly to show you're friendly",
      "Maintain direct eye contact to build trust",
      "Let the dog sniff your hand first before any touching",
      "Run away immediately if the dog seems nervous",
    ],
    correctIndex: 2,
    category: "handling",
  },
  {
    id: 20,
    question:
      "A dog growls when you approach its food bowl. This is resource guarding. What should you do?",
    options: [
      "Take the bowl away immediately to teach the dog a lesson",
      "Distract the dog with a treat elsewhere and give it space to eat undisturbed",
      "Punish the dog for growling",
      "Ignore the growl and continue approaching to show you're in charge",
    ],
    correctIndex: 1,
    category: "handling",
  },
]
