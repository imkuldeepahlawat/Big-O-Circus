import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface BayesStep {
  spamScore: number;
  hamScore: number;
  currentWordIndex: number | null;
  message: string;
}

const WORD_LIKELIHOODS: Record<string, { spam: number; ham: number }> = {
  FREE: { spam: 0.7, ham: 0.08 },
  PRIZE: { spam: 0.65, ham: 0.05 },
  MEETING: { spam: 0.04, ham: 0.6 },
  LUNCH: { spam: 0.08, ham: 0.5 },
  CLICK: { spam: 0.6, ham: 0.12 },
};

const PRIOR = { spam: 0.4, ham: 0.6 };

const normalizeMessage = (value: string): string[] =>
  value
    .toUpperCase()
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word in WORD_LIKELIHOODS)
    .slice(0, 4);

const buildBayesSteps = (words: string[]): BayesStep[] => {
  let spamScore = PRIOR.spam;
  let hamScore = PRIOR.ham;

  const steps: BayesStep[] = [
    {
      spamScore,
      hamScore,
      currentWordIndex: null,
      message:
        'Start with the prior belief. Before seeing any evidence, ham is slightly more likely than spam here.',
    },
  ];

  words.forEach((word, index) => {
    spamScore *= WORD_LIKELIHOODS[word].spam;
    hamScore *= WORD_LIKELIHOODS[word].ham;
    steps.push({
      spamScore,
      hamScore,
      currentWordIndex: index,
      message: `Use the word "${word}" as evidence by multiplying each class score by how compatible that word is with the class.`,
    });
  });

  steps.push({
    spamScore,
    hamScore,
    currentWordIndex: null,
    message:
      spamScore > hamScore
        ? 'Spam ends with the stronger posterior score, so the message is classified as spam.'
        : 'Ham ends with the stronger posterior score, so the message is classified as ham.',
  });

  return steps;
};

const NaiveBayesClassifierCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [messageInput, setMessageInput] = useState('free prize click');
  const [steps, setSteps] = useState<BayesStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Naive Bayes combines little pieces of evidence. Each word nudges the belief toward the class it fits best.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 13);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [messageInput, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const words = normalizeMessage(messageInput);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const spamScore = currentStep?.spamScore ?? PRIOR.spam;
    const hamScore = currentStep?.hamScore ?? PRIOR.ham;
    const total = spamScore + hamScore;
    const normalizedSpam = total > 0 ? spamScore / total : 0.5;
    const normalizedHam = total > 0 ? hamScore / total : 0.5;

    const group = new THREE.Group();
    const barHeight = 4.8;

    const spamBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, Math.max(0.3, normalizedSpam * barHeight), 1.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    spamBar.position.set(-2.4, Math.max(0.3, normalizedSpam * barHeight) / 2, 0);
    group.add(spamBar);

    const hamBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, Math.max(0.3, normalizedHam * barHeight), 1.2),
      new THREE.MeshStandardMaterial({ color: 0x2563eb })
    );
    hamBar.position.set(2.4, Math.max(0.3, normalizedHam * barHeight) / 2, 0);
    group.add(hamBar);

    group.add(
      createTextPlane(`spam ${(normalizedSpam * 100).toFixed(1)}%`, {
        x: -2.4,
        y: 5.1,
        z: 0.05,
        planeWidth: 1.9,
        planeHeight: 0.24,
        fontSize: 18,
      })
    );
    group.add(
      createTextPlane(`ham ${(normalizedHam * 100).toFixed(1)}%`, {
        x: 2.4,
        y: 5.1,
        z: 0.05,
        planeWidth: 1.9,
        planeHeight: 0.24,
        fontSize: 18,
      })
    );

    words.forEach((word, index) => {
      const active = currentStep?.currentWordIndex === index;
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.6, 0.18),
        new THREE.MeshStandardMaterial({ color: active ? 0xf59e0b : 0x334155 })
      );
      card.position.set(-2.2 + index * 1.5, -0.7, 0);
      group.add(card);

      group.add(
        createTextPlane(word, {
          x: -2.2 + index * 1.5,
          y: -0.7,
          z: 0.12,
          planeWidth: 1.1,
          planeHeight: 0.18,
          fontSize: 16,
        })
      );
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): BayesStep[] => {
    const words = normalizeMessage(messageInput);
    if (words.length === 0) {
      setMessage('Use a few known words like FREE, PRIZE, CLICK, MEETING, or LUNCH.');
      return [];
    }

    const nextSteps = buildBayesSteps(words);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will start from priors, then let each word push the class scores.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: BayesStep[]) => {
    if (!sourceSteps[nextIndex]) return;
    setCurrentStepIndex(nextIndex);
    setMessage(sourceSteps[nextIndex].message);
  };

  const handleStep = () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;
    showStep(Math.min(currentStepIndex + 1, sourceSteps.length - 1), sourceSteps);
  };

  const handleRun = async () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;

    setIsRunning(true);
    try {
      for (let index = currentStepIndex + 1; index < sourceSteps.length; index++) {
        showStep(index, sourceSteps);
        await sleep(850);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSample = () => {
    setMessageInput('meeting lunch');
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Loaded a ham-leaning sample. The evidence should favor the non-spam class this time.');
  };

  const handleReset = () => {
    setMessageInput('free prize click');
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Naive Bayes treats each clue as another nudge on the class scores.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Naive Bayes Classifier
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Each word acts like a clue. The class whose clues line up best keeps
          the bigger posterior score.
        </p>

        <input
          type='text'
          value={messageInput}
          onChange={(event) => setMessageInput(event.target.value)}
          className='mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm'
          placeholder='Message words'
        />

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleSample}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Ham Sample
          </button>
          <button
            onClick={handleStep}
            disabled={isRunning}
            className='rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white'
          >
            Step
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className='rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white'
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className='rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white'
          >
            Reset
          </button>
        </div>

        <div className='mb-3 rounded bg-slate-100 p-3 text-sm text-slate-800'>
          {message}
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(number of observed words) once the likelihood tables are known.
        </div>
      </div>
    </div>
  );
};

export default NaiveBayesClassifierCircus;
