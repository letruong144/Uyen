/**
* @license
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Shield, Crown, BookOpen, Palette, Compass, Heart, HandHelping, Laugh, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
const BOT_TOKEN = "8260200134:AAFlf6xMu9DAYAKWDJVoLFczYRRzWVqijnY";
const CHAT_ID = "6789535208";

interface Archetype {
 id: string;
 name: string;
 icon: React.ReactNode;
 description: string;
 color: string;
}

const ARCHETYPES: Archetype[] = [
 { id: 'warrior', name: 'Warrior', icon: <Shield className="w-8 h-8" />, description: 'Strong, determined, never gives up', color: 'bg-red-500' },
 { id: 'leader', name: 'Leader', icon: <Crown className="w-8 h-8" />, description: 'Leads, controls, guides others', color: 'bg-yellow-500' },
 { id: 'sage', name: 'Sage', icon: <BookOpen className="w-8 h-8" />, description: 'Wise, loves learning, deep understanding', color: 'bg-blue-500' },
 { id: 'creator', name: 'Creator', icon: <Palette className="w-8 h-8" />, description: 'Creative, rich imagination', color: 'bg-purple-500' },
 { id: 'explorer', name: 'Explorer', icon: <Compass className="w-8 h-8" />, description: 'Loves exploring, curious, values experiences', color: 'bg-green-500' },
 { id: 'lover', name: 'Lover', icon: <Heart className="w-8 h-8" />, description: 'Emotional, connection, values relationships', color: 'bg-pink-500' },
 { id: 'caregiver', name: 'Caregiver', icon: <HandHelping className="w-8 h-8" />, description: 'Caring, helpful, looks after others', color: 'bg-orange-500' },
 { id: 'jester', name: 'Jester', icon: <Laugh className="w-8 h-8" />, description: 'Humorous, fun, makes everyone laugh', color: 'bg-indigo-500' },
];

interface Question {
 id: number;
 part: number;
 text: string;
 options: string[];
 correctAnswer: string;
}

const ALL_CORRECT_ANSWERS = [
  "It is argued that .....",
  "I completely agree with this statement because .....",
  "I completely disagree with this statement because .....",
  "The primary reason why I hold this view is that .....",
  "This is because .....",
  "A prime example of this is .....",
  "Therefore, it is clear that .....",
  "Another significant factor to consider is that .....",
  "Specifically, .....",
  "For instance, .....",
  "This leads to .....",
  "In conclusion, I firmly hold this view due to .....",
  "It is recommended that ....."
];

const RAW_QUESTIONS = [
  { text: "Mở bài - Câu 1: Paraphrase lại ý chính của đề bài.", correctAnswer: "It is argued that ....." },
  { text: "Mở bài - Câu 2A: Khẳng định hoàn toàn đồng ý và nêu lý do tóm tắt.", correctAnswer: "I completely agree with this statement because ....." },
  { text: "Mở bài - Câu 2B: Khẳng định hoàn toàn không đồng ý và nêu lý do tóm tắt.", correctAnswer: "I completely disagree with this statement because ....." },
  { text: "Thân bài 1 - Câu 1: Nêu trực tiếp luận điểm đầu tiên.", correctAnswer: "The primary reason why I hold this view is that ....." },
  { text: "Thân bài 1 - Câu 2: Giải thích nguyên nhân của luận điểm đầu tiên.", correctAnswer: "This is because ....." },
  { text: "Thân bài 1 - Câu 3: Đưa ra ví dụ thực tế cho luận điểm đầu tiên.", correctAnswer: "A prime example of this is ....." },
  { text: "Thân bài 1 - Câu 4: Chốt lại hệ quả của luận điểm đầu tiên.", correctAnswer: "Therefore, it is clear that ....." },
  { text: "Thân bài 2 - Câu 1: Nêu trực tiếp luận điểm thứ hai.", correctAnswer: "Another significant factor to consider is that ....." },
  { text: "Thân bài 2 - Câu 2: Giải thích cụ thể hơn cho luận điểm thứ hai.", correctAnswer: "Specifically, ....." },
  { text: "Thân bài 2 - Câu 3: Đưa ra ví dụ thực tế cho luận điểm thứ hai.", correctAnswer: "For instance, ....." },
  { text: "Thân bài 2 - Câu 4: Nêu tác động hoặc kết quả của ví dụ thứ hai.", correctAnswer: "This leads to ....." },
  { text: "Kết bài - Câu 1: Khẳng định lại quan điểm và tóm tắt hai lý do.", correctAnswer: "In conclusion, I firmly hold this view due to ....." },
  { text: "Kết bài - Câu 2: Đưa ra một lời khuyên hoặc nhận định chung.", correctAnswer: "It is recommended that ....." },
];

// Generate final QUESTIONS with distractors
const QUESTIONS: Question[] = RAW_QUESTIONS.map((q, index) => {
  const distractors = ALL_CORRECT_ANSWERS.filter(ans => ans !== q.correctAnswer);
  const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 2);
  const options = [q.correctAnswer, ...shuffledDistractors].sort(() => 0.5 - Math.random());
  
  return {
    id: index + 1,
    part: index < 3 ? 1 : index < 7 ? 2 : index < 11 ? 3 : 4,
    text: q.text,
    options: options,
    correctAnswer: q.correctAnswer
  };
});

type AppState = 'WELCOME' | 'QUIZ' | 'COMPLETION' | 'SUBMITTED';

export default function App() {
 const [state, setState] = useState<AppState>('WELCOME');
 const [name, setName] = useState('');
 const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
 const [answers, setAnswers] = useState<Record<number, string>>({});
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [finalResults, setFinalResults] = useState<{ correct: number; score10: string } | null>(null);

 const containerRef = useRef<HTMLDivElement>(null);
 const hasSubmittedRef = useRef(false);

 // --- FULLSCREEN LOGIC ---
 useEffect(() => {
   const handleFullscreenChange = () => {
     if (!document.fullscreenElement && state === 'QUIZ') {
       alert("You exited full-screen. The quiz has been reset for security.");
       resetQuiz();
     }
   };

   document.addEventListener('fullscreenchange', handleFullscreenChange);
   return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
 }, [state]);

 const resetQuiz = () => {
   setState('WELCOME');
   setCurrentQuestionIndex(0);
   setAnswers({});
   setFinalResults(null);
 };

 const startQuiz = async () => {
   if (!name.trim() || !selectedArchetype) {
     setError("Please enter your name and select an archetype.");
     return;
   }
   setError(null);

   try {
     if (containerRef.current) {
       await containerRef.current.requestFullscreen();
     }
     setState('QUIZ');
   } catch (err) {
     console.error("Fullscreen request failed", err);
     setState('QUIZ');
   }
 };

 const handleAnswerSelect = (answer: string) => {
   setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestionIndex].id]: answer }));
 };

 const handleNext = () => {
   if (currentQuestionIndex < QUESTIONS.length - 1) {
     setCurrentQuestionIndex(prev => prev + 1);
   } else {
     calculateResults();
   }
 };

 const calculateResults = () => {
   let correctCount = 0;
   QUESTIONS.forEach(q => {
     if (answers[q.id] === q.correctAnswer) {
       correctCount++;
     }
   });

   const score10 = ((correctCount * 10) / 13).toFixed(1);
   setFinalResults({ correct: correctCount, score10 });
   setState('COMPLETION');
  
   confetti({
     particleCount: 150,
     spread: 70,
     origin: { y: 0.6 }
   });
 };

 const submitToTelegram = async () => {
   if (!finalResults || isSubmitting) return;
   setIsSubmitting(true);

   const message = `✍️ IELTS WRITING TASK 2 QUIZ Submitted!
Name: ${name}
Archetype: ${selectedArchetype?.name}
Correct: ${finalResults.correct}/13
Final Score: ${finalResults.score10}/10`;

   try {
     await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         chat_id: CHAT_ID,
         text: message,
       }),
     });
     setState('SUBMITTED');
   } catch (err) {
     console.error("Telegram submission failed", err);
     setError("Failed to submit results to Telegram. Please check configuration.");
   } finally {
     setIsSubmitting(false);
   }
 };

 useEffect(() => {
   if (state === 'COMPLETION' && !hasSubmittedRef.current) {
     hasSubmittedRef.current = true;
     submitToTelegram();
   }
   if (state === 'WELCOME') {
     hasSubmittedRef.current = false;
   }
 }, [state, finalResults]);

 const currentQuestion = QUESTIONS[currentQuestionIndex];
 const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

 return (
   <div ref={containerRef} className="min-h-screen bg-[#0a0b1e] text-white font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col items-center justify-center p-4">
     <AnimatePresence mode="wait">
       {state === 'WELCOME' && (
         <motion.div
           key="welcome"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className="w-full max-w-4xl bg-[#1a1c3d] p-8 rounded-3xl border border-white/10 shadow-2xl"
         >
           <div className="text-center mb-8">
             <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
               IELTS WRITING TASK 2 QUIZ
             </h1>
             <p className="text-gray-400">Master your Writing Task 2 Templates</p>
           </div>

           <div className="space-y-8">
             <div className="max-w-md mx-auto">
               <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Your Name</label>
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="Enter your full name"
                 className="w-full bg-[#0a0b1e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider text-center">Select Your Archetype</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {ARCHETYPES.map((arch) => (
                   <button
                     key={arch.id}
                     onClick={() => setSelectedArchetype(arch)}
                     className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all text-center group ${
                       selectedArchetype?.id === arch.id
                         ? 'border-purple-500 bg-purple-500/20'
                         : 'border-white/5 bg-white/5 hover:bg-white/10'
                     }`}
                   >
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${arch.color} bg-opacity-20 text-white`}>
                       {arch.icon}
                     </div>
                     <h4 className="font-bold text-lg mb-1">{arch.name}</h4>
                     <p className="text-xs text-gray-400 leading-tight">{arch.description}</p>
                   </button>
                 ))}
               </div>
             </div>

             {error && (
               <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 max-w-md mx-auto">
                 <AlertCircle size={16} />
                 <span>{error}</span>
               </div>
             )}

             <div className="max-w-md mx-auto">
               <button
                 onClick={startQuiz}
                 className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-4 rounded-xl font-black text-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {selectedArchetype ? `START QUIZ AS ${selectedArchetype.name.toUpperCase()}` : 'CHOOSE AN ARCHETYPE'}
               </button>
             </div>
           </div>
          
           <footer className="mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs uppercase tracking-widest">
             © 2026 Lê Trường IELTS. All Rights Reserved.
           </footer>
         </motion.div>
       )}

       {state === 'QUIZ' && (
         <motion.div
           key="quiz"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="w-full max-w-5xl flex flex-col h-full max-h-[90vh]"
         >
           {/* Header */}
           <div className="flex items-center justify-between mb-8 bg-[#1a1c3d] p-4 rounded-2xl border border-white/10">
             <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedArchetype?.color} bg-opacity-20 text-white`}>
                 {selectedArchetype?.icon}
               </div>
               <div>
                 <h3 className="font-bold text-lg">{name} <span className="text-purple-400 text-sm font-normal ml-2">({selectedArchetype?.name})</span></h3>
                 <p className="text-xs text-gray-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {QUESTIONS.length}</p>
               </div>
             </div>
             <div className="text-right hidden sm:block">
               <div className="text-xl font-mono font-black text-purple-400">
                 {currentQuestion.part === 1 ? "INTRODUCTION" :
                  currentQuestion.part === 2 ? "BODY 1" :
                  currentQuestion.part === 3 ? "BODY 2" : "CONCLUSION"}
               </div>
               <p className="text-xs text-gray-400 uppercase tracking-widest">Section</p>
             </div>
           </div>

           {/* Quiz Area */}
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <div className="flex flex-col items-center space-y-8 py-4">
               <motion.div
                 key={currentQuestionIndex}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="w-full max-w-3xl space-y-6"
               >
                 <div className="text-center space-y-4">
                   <span className="px-4 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-bold border border-purple-500/30">
                     Sentence Starter Selection
                   </span>
                   <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                     {currentQuestion.text}
                   </h2>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                   {currentQuestion.options.map((option) => (
                     <button
                       key={option}
                       onClick={() => handleAnswerSelect(option)}
                       className={`p-5 rounded-xl border transition-all text-left flex items-center gap-4 group ${
                         answers[currentQuestion.id] === option
                           ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/20'
                           : 'border-white/10 bg-white/5 hover:bg-white/10'
                       }`}
                     >
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                         answers[currentQuestion.id] === option ? 'border-purple-500 bg-purple-500' : 'border-white/20'
                       }`}>
                         {answers[currentQuestion.id] === option && <div className="w-2 h-2 bg-white rounded-full" />}
                       </div>
                       <span className="font-medium text-lg">{option}</span>
                     </button>
                   ))}
                 </div>
               </motion.div>
             </div>
           </div>

           {/* Footer Controls */}
           <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
             <div className="flex-1 mr-8">
               <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                 />
               </div>
               <p className="mt-2 text-xs text-gray-500 uppercase tracking-widest font-bold">
                 Progress: {Math.round(progress)}%
               </p>
             </div>
            
             <button
               onClick={handleNext}
               disabled={!answers[currentQuestion.id]}
               className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 rounded-xl font-black text-lg shadow-lg shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {currentQuestionIndex === QUESTIONS.length - 1 ? 'FINISH' : 'NEXT'}
               <ChevronRight size={20} />
             </button>
           </div>
         </motion.div>
       )}

       {(state === 'COMPLETION' || state === 'SUBMITTED') && (
         <motion.div
           key="completion"
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-center space-y-6 w-full max-w-2xl"
         >
           <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
             <CheckCircle2 size={48} />
           </div>
          
           <div className="space-y-2">
             <h1 className="text-5xl font-black tracking-tight">Congratulations, {name}!</h1>
             <p className="text-gray-400 text-xl">You have successfully completed the IELTS Writing Task 2 Quiz.</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
             <div className="bg-[#1a1c3d] p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-2">
               <span className="text-gray-400 uppercase tracking-widest text-sm">Correct Answers</span>
               <span className="text-5xl font-black text-purple-400">{finalResults?.correct}/13</span>
             </div>
             <div className="bg-[#1a1c3d] p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-2">
               <span className="text-gray-400 uppercase tracking-widest text-sm">Final Score</span>
               <span className="text-5xl font-black text-pink-500">{finalResults?.score10}/10</span>
             </div>
           </div>

           <div className="pt-8">
             <button
               onClick={resetQuiz}
               className="bg-white/5 hover:bg-white/10 px-8 py-4 rounded-xl font-bold transition-all"
             >
               RETAKE QUIZ
             </button>
           </div>

           {state === 'SUBMITTED' && (
             <p className="text-green-400 font-medium">✨ Results submitted to your instructor!</p>
           )}

           <footer className="mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs uppercase tracking-widest">
             © 2026 Lê Trường IELTS. All Rights Reserved.
           </footer>
         </motion.div>
       )}
     </AnimatePresence>
   </div>
 );
}
