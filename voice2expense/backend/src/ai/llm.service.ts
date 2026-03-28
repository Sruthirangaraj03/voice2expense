import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI;
  private readonly logger = new Logger(LlmService.name);

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  async parseExpense(text: string) {
    this.logger.log(`Parsing expense from text: "${text}"`);

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a precise expense parser. Your job is to extract ONLY real expenses from voice transcriptions. Output ONLY valid JSON, nothing else.

If user mentions MULTIPLE expenses, return a JSON ARRAY. If only ONE expense, still return an ARRAY with one item.

[{"amount": NUMBER, "category": "STRING", "sub_type": "STRING", "description": "STRING", "date": "YYYY-MM-DD", "confidence": NUMBER}]

Example: "10 for tea and 200 for lunch" → [{"amount":10,"category":"food","sub_type":"tea","description":"tea","date":"${todayDate}","confidence":0.95},{"amount":200,"category":"food","sub_type":"lunch","description":"lunch","date":"${todayDate}","confidence":0.95}]

Rules:
- amount: plain number only. If user says "3810 for 15 people" → amount = 254 (auto divide). Never show split math, just the per-person amount.
- category: MUST be one of these 16 categories (lowercase):
  food, transport, shopping, bills, health, fitness, entertainment, education, grooming, clothing, maintenance, travel, family, investments, donations, other
- sub_type: specific type within category (lowercase). Use these mappings:
  food → tea, coffee, breakfast, lunch, dinner, snacks, sweets, juice, tiffin, biryani, dosa, idli, parotta, rice, noodles, pizza, burger, ice-cream, cake, bakery, fruits, dry-fruits, restaurant, zomato, swiggy, canteen, mess, street-food, milkshake, water-bottle
  transport → auto, bus, train, metro, uber, ola, rapido, cab, petrol, diesel, parking, toll, flight, bike, cycle, ferry, pass, fastag
  shopping → groceries, vegetables, amazon, flipkart, meesho, household, kitchenware, furniture, decor, bags, watches, jewellery, gifts, toys, stationery
  bills → electricity, water, gas, internet, phone, recharge, rent, emi, insurance, subscription, dth, broadband, credit-card, loan, tax, society-fee
  health → medicine, doctor, hospital, pharmacy, lab-test, dental, eyecare, ayurveda, physiotherapy, surgery, blood-test, x-ray, scan, ambulance, vaccination
  fitness → gym, yoga, protein, supplements, sports-gear, trainer, swimming, cycling, running-shoes, mat, membership
  entertainment → movie, netflix, spotify, hotstar, youtube-premium, games, outing, party, concert, sports, pub, bar, amusement-park, tickets, streaming
  education → fees, books, stationery, course, tuition, coaching, exam, certification, library, printing, laptop, udemy, coursera, workshop, seminar
  grooming → haircut, salon, spa, facial, makeup, lipstick, foundation, skincare, sunscreen, shampoo, conditioner, perfume, deodorant, shaving, waxing, threading, manicure, pedicure, hair-color, serum, moisturizer, body-wash
  clothing → shirts, pants, jeans, t-shirts, kurta, saree, dress, shoes, sandals, sneakers, chappals, socks, innerwear, jacket, hoodie, ethnic-wear, kids-wear, tailoring, laundry, dry-clean, ironing
  maintenance → repair, plumber, electrician, painting, pest-control, cleaning, appliance-service, carpenter, ac-service, ups, inverter, wifi-setup, lock-smith, waterproofing, renovation
  travel → hotel, resort, homestay, airbnb, booking, trip, vacation, visa, passport, luggage, travel-insurance, sightseeing, guide, food-on-trip
  family → kids-school, daycare, diapers, baby-food, elderly-care, family-doctor, pocket-money, tuition-kids, school-bus, uniform, birthday
  investments → sip, mutual-fund, stocks, gold, fd, rd, ppf, nps, crypto, chit-fund, post-office, lic
  donations → temple, church, mosque, charity, fundraiser, tips, ngo, crowdfunding
  other → courier, postage, photocopy, passport-photo, notary, misc, lost-money, penalty, fine
- description: brief description IN ENGLISH ONLY. Even if user speaks Hindi/Tamil/Telugu, always write description in English. If people count mentioned, include "split among N people" in description
- date: default ${todayDate} if not mentioned. "yesterday" = ${yesterdayDate}, "today" = ${todayDate}, "last week" = 7 days ago
- confidence: 0 to 1
- IMPORTANT: All output text (category, sub_type, description) MUST be in English only. Never output Hindi, Tamil, or any other language in the JSON values.
- IMPORTANT: Amount must be exact. Never round, never guess. If user says "twenty" output 20, if "one fifty" output 150.
- CRITICAL: Only extract ACTUAL expenses. If the transcription is unclear, garbled, or doesn't contain a clear expense (item + amount), return an EMPTY array []. Do NOT guess or hallucinate.
- CRITICAL: If you cannot clearly identify BOTH an item AND an amount, skip that entry. Better to miss an expense than to create a wrong one.
- Ignore filler words, greetings, background noise text. Only focus on "I spent X on Y" or "X rupees for Y" patterns.
- If transcription says something like "thank you" or random words with no expense, return [].

Output ONLY the JSON array. No explanation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 1024,
    });

    let content = response.choices[0].message.content || '[]';
    this.logger.log(`LLM response: ${content.substring(0, 300)}`);

    // Strip markdown fences if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.error(`Failed to parse LLM response: ${content}`);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  }

  async parseBudget(text: string) {
    this.logger.log(`Parsing budget from text: "${text}"`);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a budget parser. Output ONLY valid JSON, nothing else.

Parse the user's voice command to extract budget settings. Return a JSON ARRAY of budget objects.

[{"category": "STRING", "period_type": "STRING", "limit_amount": NUMBER}]

Example: "set budget for entertainment 3000" → [{"category":"entertainment","period_type":"monthly","limit_amount":3000}]
Example: "food budget 2000 weekly" → [{"category":"food","period_type":"weekly","limit_amount":2000}]
Example: "set 5000 for shopping and 3000 for grooming monthly" → [{"category":"shopping","period_type":"monthly","limit_amount":5000},{"category":"grooming","period_type":"monthly","limit_amount":3000}]

Rules:
- category: MUST be one of: food, transport, shopping, bills, health, fitness, entertainment, education, grooming, clothing, maintenance, travel, family, investments, donations, other (lowercase)
- period_type: "weekly" or "monthly". Default to "monthly" if not specified.
- limit_amount: plain number, the budget limit in INR
- The user may speak in Hindi, Tamil, Telugu, Kannada, or any Indian language. Understand the intent regardless of language.
- "budget set karo food ke liye 2000" → category: food, limit_amount: 2000
- "entertainment ku 3000 budget" → category: entertainment, limit_amount: 3000

Output ONLY the JSON array. No explanation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_tokens: 512,
    });

    let content = response.choices[0].message.content || '[]';
    this.logger.log(`Budget LLM response: ${content.substring(0, 300)}`);
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.error(`Failed to parse budget LLM response: ${content}`);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  }

  async query(question: string, context: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `You are a precise expense assistant. You ONLY answer about expenses using the data provided. Never estimate or make up numbers.

DATA RULES:
- "summary" = ACTUAL money spent (use for "how much did I spend" questions)
- "category_breakdown_this_month" = per-category spending with individual transactions
- "recent_expenses" = list of individual expense entries
- "budgets" = spending LIMITS (goals, NOT actual spending). Only mention when user asks about budgets.
- NEVER mix budget limits with expense totals.

ACCURACY:
- Every Rs. amount MUST come directly from the data. Zero tolerance for guessing.
- If summary.this_month_total is 2000, say "Rs.2,000" exactly.
- If no data exists, say "No expenses recorded for that period."

RESPONSE FORMAT — always use this structured style:

For total questions:
Total spent this month: Rs.X,XXX (Y transactions)

For category questions:
Category Breakdown:
- Food: Rs.X,XXX (N items)
- Transport: Rs.X,XXX (N items)

For listing expenses:
Date        | Category   | Item         | Amount
27 Mar 2026 | Food       | lunch        | Rs.200
27 Mar 2026 | Transport  | auto         | Rs.50

For budget questions:
Category  | Spent    | Limit    | Status
Food      | Rs.2,000 | Rs.5,000 | 40% used

FORMATTING RULES:
- Plain text only. NO markdown (no **, no #, no *).
- Use "Rs." with Indian number format (Rs.1,200 not Rs.1200).
- Use table-like alignment with | separator for listings.
- Use "- " for simple bullet lists.
- Keep it short. No filler, no preamble, no "Sure!" or "Here you go".
- Start directly with the answer.`,
        },
        {
          role: 'user',
          content: `DATA (source of truth — use ONLY these numbers):\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0,
      max_tokens: 512,
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
}
