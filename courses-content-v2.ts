/**
 * DJ Academy - Contenu Pédagogique Adapté par Niveau Utilisateur
 * 
 * Structure:
 * - Débutant: Simple, guidé, rassurant, pas de jargon
 * - Intermédiaire: Technique, structuré, progressif
 * - Avancé/Pro: Astuces pro, logique professionnelle
 */

export type UserLevel = "beginner" | "intermediate" | "advanced";

export interface CourseContent {
  level: number;
  title: string;
  description: string;
  videoUrl: string;
  videoDescription: string;
  summary: string;
  exercise: {
    title: string;
    description: string;
    steps: string[];
  };
  tips: string[];
}

export interface CourseCurriculum {
  beginner: CourseContent[];
  intermediate: CourseContent[];
  advanced: CourseContent[];
}

export const coursesCurriculum: CourseCurriculum = {
  beginner: [
    // Niveau 1 - Débutant
    {
      level: 1,
      title: "Les Bases du DJing",
      description: "Comprends comment deux musiques peuvent jouer ensemble sans chaos",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Regarde comment un vrai DJ synchronise deux chansons en direct. Tu vas voir, c'est plus simple que tu penses.",
      summary: `
**Le secret du DJing: la synchronisation**

Imagine deux chansons qui jouent en même temps. Si elles ne sont pas au même rythme, c'est un désastre 🎵

**Le BPM (Beats Per Minute):**
- C'est le nombre de battements par minute
- House music: 120-130 BPM
- Techno: 120-140 BPM
- Hip-Hop: 85-115 BPM

**La Sync (synchronisation):**
- Mettre deux chansons au même BPM
- Utiliser le Pitch (vitesse) pour ajuster
- C'est comme mettre deux métronomes à la même vitesse

**Pourquoi c'est important:**
- Les gens veulent danser sur un rythme régulier
- Si le rythme change, les gens arrêtent de danser
- Un bon DJ = un rythme stable et engageant
      `,
      exercise: {
        title: "Synchronise deux chansons (simulation)",
        description: "Pratique avec deux pistes audio pour sentir comment ça marche",
        steps: [
          "Écoute la première chanson et compte les battements: 1-2-3-4, 1-2-3-4...",
          "Écoute la deuxième chanson et fais pareil",
          "Essaie de les écouter ensemble mentalement - elles sonnent bien ensemble?",
          "Si la deuxième est plus rapide, imagine-la ralentir",
          "Si la deuxième est plus lente, imagine-la accélérer",
          "Quand tu les imagines au même rythme, c'est gagné! 🎉",
        ],
      },
      tips: [
        "Le BPM c'est juste un nombre - pas besoin de paniquer",
        "Utilise une app comme Shazam pour voir le BPM d'une chanson",
        "Écoute tes chansons préférées et essaie de compter le BPM",
      ],
    },
    // Niveau 2 - Débutant+
    {
      level: 2,
      title: "Les Équaliseurs (EQ)",
      description: "Comment faire sonner deux chansons ensemble sans que ce soit horrible",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Vois comment un DJ utilise l'EQ pour mélanger deux chansons. C'est comme régler le volume des basses et des aigus.",
      summary: `
**L'EQ: le secret pour des transitions fluides**

Quand tu mixes deux chansons, elles ne sonnent pas toujours bien ensemble. L'EQ c'est la solution.

**Les 3 bandes principales:**
- **Basses (Low)**: 20-250 Hz - Le "boom" que tu sens
- **Médiums (Mid)**: 250-4000 Hz - La voix, les mélodies
- **Aigus (High)**: 4000+ Hz - L'énergie, la clarté

**Comment ça marche:**
1. Baisse les basses de la chanson qui arrive
2. Augmente les aigus pour créer de la tension
3. Quand tu fais le mix, augmente les basses progressivement
4. Résultat: une transition fluide et naturelle

**Pourquoi c'est important:**
- Deux chansons avec beaucoup de basses = ça sature
- L'EQ te permet de "nettoyer" le son
- Ça rend les transitions professionnelles
      `,
      exercise: {
        title: "Pratique l'EQ avec une chanson",
        description: "Apprends à écouter les différentes fréquences",
        steps: [
          "Écoute une chanson normale",
          "Imagine-toi enlever toutes les basses - ça sonne comment?",
          "Imagine-toi enlever tous les aigus - ça sonne comment?",
          "Imagine-toi enlever les médiums - ça sonne creux, non?",
          "Maintenant écoute la chanson complète - tu entends mieux chaque partie",
        ],
      },
      tips: [
        "Commence par des changements extrêmes pour bien entendre",
        "Après, fais des ajustements plus subtils",
        "L'EQ c'est pas pour détruire le son, c'est pour l'améliorer",
      ],
    },
    // Niveau 3 - Débutant+
    {
      level: 3,
      title: "Les Transitions Basiques",
      description: "Comment passer d'une chanson à l'autre sans que ça soit bizarre",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Regarde une vraie transition en club. C'est simple: tu diminues une chanson et tu augmentes l'autre.",
      summary: `
**La transition: l'art de passer d'une chanson à l'autre**

Une bonne transition c'est invisible. Les gens ne réalisent même pas que tu as changé de chanson.

**Les 3 étapes d'une transition:**

1. **Préparation (10-15 secondes avant)**
   - Baisse les basses de la chanson actuelle
   - Augmente les aigus pour créer de la tension
   - Les gens sentent que quelque chose arrive

2. **Le Mix (5-10 secondes)**
   - Augmente le volume de la nouvelle chanson
   - Baisse le volume de l'ancienne
   - Les deux jouent ensemble brièvement

3. **Le Coup (1-2 secondes)**
   - Coupe l'ancienne chanson
   - La nouvelle chanson prend le contrôle
   - La foule explose 🎉

**Pourquoi c'est important:**
- C'est ce qui rend un DJ professionnel
- Ça maintient l'énergie sur la piste
- Ça crée de la tension et du plaisir
      `,
      exercise: {
        title: "Pratique la transition mentale",
        description: "Avant de toucher à un équipement, entraîne-toi à visualiser",
        steps: [
          "Choisis deux chansons que tu aimes",
          "Écoute la première chanson jusqu'à 30 secondes avant la fin",
          "Imagine que tu mets la deuxième chanson",
          "Visualise: basses baissées, aigus montés, tension créée",
          "Puis imagine le mix: les deux jouent ensemble",
          "Puis imagine le coup: l'ancienne s'en va, la nouvelle prend le contrôle",
          "Répète jusqu'à ce que ça te semble naturel",
        ],
      },
      tips: [
        "Les meilleures transitions sont invisibles",
        "Pratique d'abord mentalement, puis avec du matériel",
        "Écoute des DJs professionnels pour comprendre le timing",
      ],
    },
  ],
  intermediate: [
    // Niveau 4 - Intermédiaire
    {
      level: 4,
      title: "Le Mixage Harmonique",
      description: "Mélange les chansons pour qu'elles sonnent musicalement parfaites ensemble",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Découvre comment les DJs choisissent les chansons qui sonnent bien ensemble. C'est de la musique, pas du hasard.",
      summary: `
**Le Mixage Harmonique: La Science Derrière la Magie**

Pourquoi certaines chansons sonnent parfaites ensemble et d'autres non? C'est la clé musicale.

**Les Clés Musicales:**
- Chaque chanson a une clé (Do, Ré, Mi, etc.)
- Les clés compatibles sonnent bien ensemble
- Les clés incompatibles créent de la dissonance

**Les Clés Compatibles:**
- Même clé = parfait
- Clé relative (3 demi-tons) = très bien
- Clé adjacente (1 demi-ton) = acceptable

**Exemple Pratique:**
- Chanson A en Do majeur
- Chanson B en Do majeur = parfait
- Chanson B en La mineur = très bien (clé relative)
- Chanson B en Si majeur = acceptable
- Chanson B en Fa# majeur = dissonance (à éviter)

**Comment Trouver la Clé:**
- Utilise une app comme Mixed In Key
- Écoute attentivement et essaie de sentir
- Pratique avec des chansons que tu connais bien

**Pourquoi C'est Important:**
- Les transitions harmoniques sonnent professionnelles
- Ça crée une progression musicale
- Les musiciens reconnaissent la qualité
      `,
      exercise: {
        title: "Identifie les clés musicales",
        description: "Entraîne-toi à reconnaître les clés par l'oreille",
        steps: [
          "Utilise Mixed In Key ou Serato pour voir les clés",
          "Écoute 5 chansons et note leur clé",
          "Essaie de les mélanger par clé compatible",
          "Écoute le résultat - ça sonne mieux?",
          "Répète avec des chansons différentes",
          "Progressivement, tu vas reconnaître les clés à l'oreille",
        ],
      },
      tips: [
        "Le mixage harmonique c'est un art, pas une science exacte",
        "Certains DJs l'ignorent complètement, d'autres l'adorent",
        "C'est particulièrement important en House et Techno",
      ],
    },
    // Niveau 5 - Intermédiaire
    {
      level: 5,
      title: "Structurer un Set",
      description: "Crée une progression musicale qui tient les gens engagés pendant 2-4 heures",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Vois comment un DJ professionnel structure son set. C'est comme raconter une histoire avec de la musique.",
      summary: `
**La Structure d'un Set: L'Arc Narratif de la Musique**

Un bon set c'est comme un film: il y a un début, un milieu, une fin. Et des moments de tension et de relâche.

**Les 4 Phases d'un Set:**

1. **L'Intro (0-15 min)**
   - Énergie basse (120-125 BPM)
   - Ambiance cool et accueillante
   - Objectif: faire entrer les gens dans l'ambiance
   - Exemple: Deep House, Techno minimal

2. **La Montée (15-45 min)**
   - Énergie moyenne (125-130 BPM)
   - Progressivement plus de basses et de synthés
   - Objectif: créer de la tension
   - Exemple: Progressive House, Techno

3. **Le Pic (45-120 min)**
   - Énergie maximale (130-140 BPM)
   - Basses massives, synthés énormes
   - Objectif: faire danser la foule
   - Exemple: House, Techno, Electro

4. **L'Outro (120-180 min)**
   - Énergie qui redescend progressivement
   - Retour à des BPM plus bas
   - Objectif: laisser les gens partir heureux
   - Exemple: Deep House, Ambient

**Les Règles d'Or:**
- Augmente le BPM progressivement (jamais d'à-coups)
- Alterne entre tension et relâche
- Lis l'énergie de la foule
- Adapte-toi au moment de la nuit

**Pourquoi C'est Important:**
- Un set sans structure c'est ennuyeux
- Une bonne structure = une bonne soirée
- C'est la différence entre un DJ et un jukebox
      `,
      exercise: {
        title: "Crée ton premier set",
        description: "Construis un set de 1 heure avec une bonne structure",
        steps: [
          "Choisis 15-20 chansons que tu aimes",
          "Organise-les par BPM (du plus bas au plus haut)",
          "Crée 4 sections: Intro, Montée, Pic, Outro",
          "Assure-toi que chaque transition a du sens",
          "Écoute ton set du début à la fin",
          "Ajuste si quelque chose ne fonctionne pas",
        ],
      },
      tips: [
        "La structure c'est un guide, pas une règle stricte",
        "Lis la foule et adapte-toi",
        "Les meilleurs DJs sont flexibles",
      ],
    },
  ],
  advanced: [
    // Niveau 6 - Avancé
    {
      level: 6,
      title: "Techniques Avancées: Looping & Sampling",
      description: "Crée des boucles et des effets pour transformer les chansons en temps réel",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Découvre comment les DJs créent des boucles et des effets en direct. C'est où ça devient vraiment créatif.",
      summary: `
**Les Techniques Avancées: Où la Créativité Rencontre la Technique**

Les DJs professionnels ne se contentent pas de mixer. Ils créent, ils transforment, ils innovent.

**Le Looping:**
- Répète une section de chanson (4 beats, 8 beats, 16 beats)
- Crée une boucle hypnotique
- Ajoute des effets par-dessus
- Résultat: une nouvelle progression musicale

**Le Sampling:**
- Enregistre un moment d'une chanson
- Rejoue-le à différentes vitesses
- Crée une texture nouvelle
- Combine plusieurs samples pour une création unique

**Les Effets Avancés:**
- Reverb: crée de l'espace et de la profondeur
- Delay: crée de la texture et du rythme
- Filter: coupe ou augmente les fréquences dynamiquement
- Flanger/Phaser: crée des effets psychédéliques

**Pourquoi C'est Important:**
- Ça montre ta créativité
- Ça crée des moments uniques dans ton set
- Ça transforme un set bon en set extraordinaire

**La Règle d'Or:**
- Moins c'est plus
- Utilise les effets pour créer de la tension, pas pour montrer que tu sais les utiliser
- Les meilleurs DJs sont subtils
      `,
      exercise: {
        title: "Crée une boucle créative",
        description: "Pratique avec une section de chanson pour créer quelque chose de nouveau",
        steps: [
          "Choisis une chanson avec une section intéressante (4-8 bars)",
          "Isole cette section et crée une boucle",
          "Écoute-la 5-10 fois pour bien la connaître",
          "Ajoute un effet simple (reverb ou delay)",
          "Puis ajoute un deuxième effet",
          "Crée une progression: boucle simple → avec effets → boucle + autre chanson",
        ],
      },
      tips: [
        "Les boucles peuvent être hypnotiques ou ennuyeuses",
        "Utilise-les pour créer de la tension avant un pic",
        "Combine les boucles avec d'autres chansons pour plus d'impact",
      ],
    },
    // Niveau 7 - Avancé
    {
      level: 7,
      title: "Lire la Foule & Adapter en Temps Réel",
      description: "Deviens un vrai DJ: lis l'énergie et adapte ton set instantanément",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      videoDescription: "Regarde comment les DJs pros lisent la foule et changent leur set en direct. C'est l'art du DJing.",
      summary: `
**Lire la Foule: L'Art Invisible du DJing**

La technique c'est bien. Mais lire la foule c'est ce qui sépare les bons DJs des grands DJs.

**Les Signaux de la Foule:**

1. **Foule Engagée:**
   - Les gens dansent
   - Les mains en l'air
   - Sourires, énergie positive
   - → Continue dans la même direction

2. **Foule Fatiguée:**
   - Les gens arrêtent de danser
   - Ils se regroupent en petits groupes
   - Énergie basse
   - → Change de vibe, augmente l'énergie

3. **Foule Confuse:**
   - Les gens ne savent pas comment danser
   - Mouvements hésitants
   - Énergie incertaine
   - → Reviens à quelque chose de plus simple

4. **Foule Prête pour le Pic:**
   - Énergie croissante
   - Les gens demandent plus
   - Ambiance électrique
   - → C'est le moment de lâcher le pic

**Comment Adapter en Temps Réel:**
- Prépare 2-3 chansons alternatives
- Si la foule réagit bien: continue
- Si la foule s'ennuie: change immédiatement
- Observe les 30 premières secondes de chaque chanson
- Sois prêt à switcher rapidement

**La Mentalité Pro:**
- Ton set est un guide, pas une prison
- La foule est ton instrument
- Tu joues la foule, pas la musique
- Flexibilité = professionnalisme

**Pourquoi C'est Important:**
- C'est la différence entre un DJ et un producteur
- C'est ce qui crée des soirées inoubliables
- C'est ce que les clubs recherchent
      `,
      exercise: {
        title: "Pratique la lecture de foule",
        description: "Apprends à reconnaître les signaux de la foule",
        steps: [
          "Regarde des vidéos de DJs en club",
          "Observe comment les gens réagissent",
          "Note les moments où la foule explose",
          "Note les moments où la foule s'ennuie",
          "Essaie de prédire ce que le DJ va faire",
          "Regarde si tu avais raison",
          "Répète jusqu'à ce que tu reconnaisses les patterns",
        ],
      },
      tips: [
        "La foule c'est honnête - elle ne ment pas",
        "Apprends à lire les signaux subtils",
        "La meilleure musique du monde ne sauve pas un mauvais timing",
      ],
    },
  ],
};

/**
 * Helper function: Get course content based on user level
 */
export function getCourseByLevelAndUserLevel(
  courseLevel: number,
  userLevel: UserLevel
): CourseContent | null {
  const curriculum = coursesCurriculum[userLevel];
  const course = curriculum.find((c) => c.level === courseLevel);
  return course || null;
}

/**
 * Get all courses for a user level
 */
export function getAllCoursesByUserLevel(userLevel: UserLevel): CourseContent[] {
  return coursesCurriculum[userLevel];
}
