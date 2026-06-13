import React from 'react';
import {
  Film, Flower2, Dumbbell, UtensilsCrossed, BookOpen, Car, Gamepad2, HeartPulse,
  BrainCircuit, ShoppingBag, GraduationCap, Shield, Wifi, Code, BarChart3,
  Database, FlaskConical, Music, Smartphone, HeartHandshake, PawPrint, Camera,
  Shirt, Building, MapPin, Trophy, Palette, Wrench, Monitor, Sprout, Moon, Star,
  FileText
} from 'lucide-react';

export const getIdeaIcon = (title) => {
  const t = (title || '').toLowerCase();

  if (t.includes('movie') || t.includes('film') || t.includes('cinema'))
    return <Film size={16} />;
  if (t.includes('flower') || t.includes('blooming') || t.includes('plant') ||
      t.includes('green') || t.includes('greenhouse') || t.includes('garden') ||
      t.includes('greenity') || t.includes('bloom'))
    return <Flower2 size={16} />;
  if (t.includes('gym') || t.includes('fitness') || t.includes('workout') ||
      t.includes('muscle') || t.includes('diet') || t.includes('fit'))
    return <Dumbbell size={16} />;
  if (t.includes('food') || t.includes('restaurant') || t.includes('grilled') ||
      t.includes('taste') || t.includes('cook') || t.includes('bite') ||
      t.includes('meal') || t.includes('mama') || t.includes('plate') ||
      t.includes('foodie') || t.includes('mango') || t.includes('frozy') ||
      t.includes('zad') || t.includes('recipe'))
    return <UtensilsCrossed size={16} />;
  if (t.includes('book') || t.includes('library') || t.includes('reading') ||
      t.includes('booknest') || t.includes('bookclub') || t.includes('story') ||
      t.includes('marionette'))
    return <BookOpen size={16} />;
  if (t.includes('car') || t.includes('vehicle') || t.includes('truck') ||
      t.includes('carmart') || t.includes('parking') || t.includes('traket') ||
      t.includes('van') || t.includes('ride') || t.includes('carpool') ||
      t.includes('bus') || t.includes('uav') || t.includes('drone') ||
      t.includes('navigation') || t.includes('tareeq') || t.includes('marsa') ||
      t.includes('maritime') || t.includes('vessel') || t.includes('logistics') ||
      t.includes('mart') || !t.includes('super') && t.includes('mart'))
    return <Car size={16} />;
  if (t.includes('game') || t.includes('gaming') || t.includes('npc') ||
      t.includes('horror') || t.includes('pedia') || t.includes('gamepedia') ||
      t.includes('next gen'))
    return <Gamepad2 size={16} />;
  if (t.includes('health') || t.includes('medical') || t.includes('disease') ||
      t.includes('patient') || t.includes('clinical') || t.includes('hospital') ||
      t.includes('doctor') || t.includes('doctoleb') || t.includes('dentist') ||
      t.includes('cancer') || t.includes('parkinson') || t.includes('vaccine') ||
      t.includes('vax') || t.includes('prescription') || t.includes('prescripto') ||
      t.includes('med') || t.includes('care') || t.includes('cedars') ||
      t.includes('vertu') || t.includes('vero') || t.includes('medlab') ||
      t.includes('skincare') || t.includes('naturio') || t.includes('life') ||
      t.includes('nabd') || t.includes('heart') || t.includes('vital') ||
      t.includes('wellness') || t.includes('aura'))
    return <HeartPulse size={16} />;
  if (t.includes('ai') && !t.includes('plantcare') || t.includes('machine learning') ||
      t.includes('deep learning') || t.includes('neural') || t.includes('llm') ||
      t.includes('nlp') || t.includes('chatbot') || t.includes('intelligent') ||
      t.includes('intelligram') || t.includes('plantcare'))
    return <BrainCircuit size={16} />;
  if (t.includes('store') || t.includes('shop') || t.includes('e-com') ||
      t.includes('ecommerce') || t.includes('outlet') || t.includes('commerce') ||
      t.includes('khalil') || t.includes('bazaar') || t.includes('market') ||
      t.includes('mycommerce') || t.includes('tech life') || t.includes('home-made') ||
      t.includes('craft') || t.includes('craftella') || t.includes('sou2na') ||
      t.includes('essentially'))
    return <ShoppingBag size={16} />;
  if (t.includes('school') || (t.includes('education') && !t.includes('physical')) ||
      t.includes('university') || t.includes('tutoring') || t.includes('tutor') ||
      t.includes('tutopia') || t.includes('course') || t.includes('math') ||
      t.includes('learn') || t.includes('teach') || t.includes('classroom') ||
      t.includes('student') || t.includes('academy') || t.includes('campus') ||
      t.includes('ums') || t.includes('curriculum') || t.includes('academic') ||
      t.includes('teaching') || t.includes('mentor') || t.includes('course') ||
      t.includes('pathwise') || t.includes('skills') || t.includes('skillhub') ||
      t.includes('opportu') || t.includes('intern') || t.includes('portfolio') ||
      t.includes('rising minds') || t.includes('career'))
    return <GraduationCap size={16} />;
  if (t.includes('security') || t.includes('privacy') || t.includes('cyber') ||
      t.includes('encryption') || t.includes('pentest') || t.includes('intrusion') ||
      t.includes('guard') || t.includes('benchmark') || t.includes('anomaly'))
    return <Shield size={16} />;
  if (t.includes('iot') || t.includes('sensor') || t.includes('smart') ||
      t.includes('embedded') || t.includes('meeting room'))
    return <Wifi size={16} />;
  if (t.includes('code') || t.includes('programming') || t.includes('software') ||
      t.includes('algorithm') || t.includes('forge') || t.includes('developer') ||
      t.includes('dev') || t.includes('platform') || t.includes('nexus') ||
      t.includes('taskflow') || t.includes('forge') || t.includes('temple'))
    return <Code size={16} />;
  if (t.includes('data') || t.includes('analytics') || t.includes('dashboard') ||
      t.includes('visualization') || t.includes('insight') || t.includes('edinsights') ||
      t.includes('benchmark'))
    return <BarChart3 size={16} />;
  if (t.includes('database') || t.includes('big data') || t.includes('sql') ||
      t.includes('nosql') || t.includes('repository') || t.includes('archive'))
    return <Database size={16} />;
  if (t.includes('chemistry') || t.includes('drug') || t.includes('molecule') ||
      t.includes('research') || t.includes('sci') || t.includes('groundwater') ||
      t.includes('water') || t.includes('electrical') || t.includes('conductivity'))
    return <FlaskConical size={16} />;
  if (t.includes('music') || t.includes('audio') || t.includes('voice') ||
      t.includes('recording') || t.includes('voicera') || t.includes('podcast'))
    return <Music size={16} />;
  if ((t.includes('mobile') || t.includes('app')) &&
      !t.includes('health') && !t.includes('smart'))
    return <Smartphone size={16} />;
  if (t.includes('charity') || t.includes('donation') || t.includes('fundraising') ||
      t.includes('fillia') || t.includes('sakan') || t.includes('share the') ||
      t.includes('sharek') || t.includes('volunteer') || t.includes('rebuild') ||
      t.includes('organ') || t.includes('blood'))
    return <HeartHandshake size={16} />;
  if (t.includes('pet') || t.includes('paw') || t.includes('dog') ||
      t.includes('cat') || t.includes('veterinary') || t.includes('chick') ||
      t.includes('chickaid') || t.includes('animal'))
    return <PawPrint size={16} />;
  if (t.includes('camera') || t.includes('vision') || t.includes('image') ||
      t.includes('scan') || t.includes('detection') || t.includes('gesture') ||
      t.includes('hand') || (t.includes('recognition') && !t.includes('voice')) ||
      t.includes('scansage'))
    return <Camera size={16} />;
  if (t.includes('fashion') || t.includes('clothing') || t.includes('hijab') ||
      t.includes('jewelry') || t.includes('gem') || t.includes('crochet') ||
      t.includes('craftella') || t.includes('beiroutique') || t.includes('zaytuna') ||
      t.includes('anarava'))
    return <Shirt size={16} />;
  if (t.includes('building') || t.includes('construction') || t.includes('housing') ||
      t.includes('renov') || t.includes('architect') || t.includes('arcemi') ||
      t.includes('real estate') || t.includes('property') || t.includes('estate'))
    return <Building size={16} />;
  if (t.includes('travel') || t.includes('tourism') || t.includes('explore') ||
      t.includes('lebanon') || t.includes('beirut') || t.includes('beiroutique'))
    return <MapPin size={16} />;
  if (t.includes('sport') || t.includes('karate') || t.includes('swim') ||
      t.includes('stadium') || t.includes('pitch') || t.includes('pitchpal') ||
      t.includes('sportify') || t.includes('trophy'))
    return <Trophy size={16} />;
  if (t.includes('design') || t.includes('artist') || t.includes('gallery') ||
      t.includes('creative') || t.includes('palette') || t.includes('designers'))
    return <Palette size={16} />;
  if (t.includes('maintenance') || t.includes('repair') || t.includes('wrench') ||
      t.includes('fix') || t.includes('service') || t.includes('fixperts') ||
      t.includes('fix masters') || t.includes('yallaservice'))
    return <Wrench size={16} />;
  if (t.includes('pc') || t.includes('computer') || t.includes('hardware') ||
      t.includes('monitor') || t.includes('tech') || t.includes('techhub'))
    return <Monitor size={16} />;
  if (t.includes('sustainability') || t.includes('green') || t.includes('nature') ||
      t.includes('environment') || t.includes('greenity'))
    return <Sprout size={16} />;
  if (t.includes('prayer') || t.includes('tahajjad') || t.includes('islam') ||
      t.includes('mosque') || t.includes('hawzat') || t.includes('shajara') ||
      t.includes('sadah') || t.includes('martyr') || t.includes('mahdi') ||
      t.includes('baqiyat') || t.includes('allah') || t.includes('tayeba') ||
      t.includes('scout') || t.includes('scouts'))
    return <Moon size={16} />;
  if (t.includes('social') || t.includes('community') || t.includes('network') ||
      t.includes('connect') || t.includes('muconnect') || t.includes('mu connect') ||
      t.includes('uniconnect') || t.includes('along the way') || t.includes('sawa'))
    return <Star size={16} />;
  if (t.includes('pos') || t.includes('point of sale') || t.includes('retail'))
    return <ShoppingBag size={16} />;

  return <FileText size={16} />;
};
