/**
 * LTAD Assessment Configuration
 * Maps assessments to the three LTAD tracking categories
 * Based on Athletics Canada's Long Term Athlete Development Framework
 */

export interface AssessmentConfig {
  id: string;
  name: string;
  description: string;
  image: string | null; // null = use text placeholder
  frequency: string;
  category: LTADCategory;
  subCategory?: string;
  isActive: boolean;
}

export type LTADCategory = 'anthropometric' | 'musculoskeletal' | 'fiveS';

export const categoryLabels: Record<LTADCategory, string> = {
  anthropometric: 'Anthropometric Measurements',
  musculoskeletal: 'Musculoskeletal Screening',
  fiveS: 'The 5 S\'s of Training & Performance',
};

/**
 * All available assessments organized by LTAD category
 * Max 3 assessments per category (including sub-categories)
 */
export const assessmentConfig: AssessmentConfig[] = [
  // Anthropometric Measurements (Monthly)
  {
    id: 'standing-height',
    name: 'Standing Height',
    description: 'Monitor growth and predict Peak Height Velocity (PHV)',
    image: null, // Text placeholder
    frequency: 'Monthly',
    category: 'anthropometric',
    isActive: false,
  },
  {
    id: 'body-weight',
    name: 'Body Weight',
    description: 'Track growth rate and development trends',
    image: null, // Text placeholder
    frequency: 'Monthly',
    category: 'anthropometric',
    isActive: false,
  },
  {
    id: 'arm-span',
    name: 'Arm Span',
    description: 'Measure overall proportions and growth patterns',
    image: null, // Text placeholder
    frequency: 'Monthly',
    category: 'anthropometric',
    isActive: false,
  },

  // Musculoskeletal Screening - Postural Alignment
  {
    id: 'standing-posture',
    name: 'Standing Posture Assessment',
    description: 'Evaluate head, shoulders, spine, and hip alignment',
    image: null, // Text placeholder
    frequency: 'Quarterly',
    category: 'musculoskeletal',
    subCategory: 'Postural Alignment',
    isActive: false,
  },

  // Musculoskeletal Screening - Movement Patterns
  {
    id: 'squat',
    name: 'Overhead Squat',
    description: 'Assess squat depth, knee tracking, and trunk angle',
    image: '/squat.png',
    frequency: 'Quarterly',
    category: 'musculoskeletal',
    subCategory: 'Movement Patterns',
    isActive: false,
  },
  {
    id: 'lunge',
    name: 'Forward Lunge',
    description: 'Evaluate knee stability, hip mobility, and trunk control',
    image: '/lunge.png',
    frequency: 'Quarterly',
    category: 'musculoskeletal',
    subCategory: 'Movement Patterns',
    isActive: false,
  },

  // Musculoskeletal Screening - Neuromuscular Balance
  {
    id: 'balance',
    name: 'One Leg Balance',
    description: 'Test stability, proprioception, and balance control',
    image: '/OneLegBalance.png',
    frequency: 'Quarterly',
    category: 'musculoskeletal',
    subCategory: 'Neuromuscular Balance',
    isActive: true, // Currently active
  },

  // The 5 S's - Stamina
  {
    id: 'pacer',
    name: 'PACER (Beep Test)',
    description: 'Measure aerobic capacity using progressive shuttle runs',
    image: null, // Text placeholder
    frequency: 'Every 8-12 weeks',
    category: 'fiveS',
    subCategory: 'Stamina (Endurance)',
    isActive: false,
  },

  // The 5 S's - Strength
  {
    id: 'push-up',
    name: 'Push-Up Test',
    description: 'Assess upper body strength and core stability',
    image: null, // Text placeholder
    frequency: 'Every 8-12 weeks',
    category: 'fiveS',
    subCategory: 'Strength',
    isActive: false,
  },

  // The 5 S's - Speed
  {
    id: '10m-sprint',
    name: '10m Sprint',
    description: 'Measure acceleration and explosive power',
    image: null, // Text placeholder
    frequency: 'Every 6-8 weeks',
    category: 'fiveS',
    subCategory: 'Speed',
    isActive: false,
  },

  // The 5 S's - Suppleness
  {
    id: 'sit-reach',
    name: 'Sit and Reach',
    description: 'Evaluate hamstring and lower back flexibility',
    image: null, // Text placeholder
    frequency: 'Monthly',
    category: 'fiveS',
    subCategory: 'Suppleness (Flexibility)',
    isActive: false,
  },

  // The 5 S's - Skill
  {
    id: 'running-mechanics',
    name: 'Running Mechanics',
    description: 'Assess arm action, posture, and foot strike technique',
    image: null, // Text placeholder
    frequency: 'Ongoing',
    category: 'fiveS',
    subCategory: 'Skill',
    isActive: false,
  },
];

/**
 * Get assessments filtered by category
 * Includes both active and coming soon
 */
export function getAssessmentsByCategory(category: LTADCategory): AssessmentConfig[] {
  return assessmentConfig
    .filter((assessment) => assessment.category === category)
    .slice(0, 3); // Max 3 per category
}

/**
 * Get all unique sub-categories within a category
 */
export function getSubCategories(category: LTADCategory): string[] {
  const subCats = new Set<string>();
  assessmentConfig
    .filter((assessment) => assessment.category === category && assessment.subCategory)
    .forEach((assessment) => {
      if (assessment.subCategory) {
        subCats.add(assessment.subCategory);
      }
    });
  return Array.from(subCats);
}

/**
 * Get assessments by category and sub-category
 */
export function getAssessmentsBySubCategory(
  category: LTADCategory,
  subCategory: string
): AssessmentConfig[] {
  return assessmentConfig.filter(
    (assessment) =>
      assessment.category === category && assessment.subCategory === subCategory
  );
}

/**
 * Get all active and coming soon assessments (no filtering)
 */
export function getAllAssessments(): AssessmentConfig[] {
  return assessmentConfig;
}

/**
 * Check if an assessment has an image
 */
export function hasImage(assessment: AssessmentConfig): boolean {
  return assessment.image !== null;
}

/**
 * Get image or placeholder text
 */
export function getImageOrPlaceholder(assessment: AssessmentConfig): {
  type: 'image' | 'placeholder';
  value: string;
} {
  if (assessment.image) {
    return { type: 'image', value: assessment.image };
  }
  return { type: 'placeholder', value: assessment.name };
}
