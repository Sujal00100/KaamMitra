import OpenAI from "openai";

// Initialize the OpenAI client with the API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Context about WorkBuddy to help generate more accurate responses
const SYSTEM_PROMPT = `You are WorkBuddy Assistant, the customer support AI for WorkBuddy, a hyperlocal job platform connecting daily wage workers (construction workers, plumbers, housemaids, electricians) with employers in their area.

Key features of WorkBuddy:
- Location-based job matching for local workers and employers
- WhatsApp integration for communication (no app needed)
- Worker verification and rating system
- Separate interfaces for workers and employers
- UPI-based payment system

Your role is to assist users with questions about:
1. How to use the platform
2. Registration and account setup
3. Finding jobs or workers
4. Verification process
5. Payment methods
6. General troubleshooting

Keep responses friendly, clear, and concise. For complex issues beyond your scope, advise users to contact human support at support@workbuddy.com.`;

/**
 * Get a response from the AI customer support assistant
 * @param {string} message User's message/question
 * @returns {Promise<string>} AI assistant's response
 */
export async function getChatbotResponse(message) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again later or contact our human support team at support@workbuddy.com.";
  }
}

/**
 * Get job recommendations based on worker skills and preferences
 * @param {Object} workerProfile Information about the worker's skills and preferences
 * @param {string} workerProfile.primarySkill The worker's primary skill
 * @param {string} workerProfile.location The worker's location
 * @param {Array<string>} [workerProfile.preferredJobTypes] Optional array of preferred job types
 * @returns {Promise<string>} Personalized job recommendations
 */
export async function getJobRecommendations(workerProfile) {
  try {
    const prompt = `As WorkBuddy's AI assistant, provide personalized job recommendations for a worker with the following profile:
- Primary Skill: ${workerProfile.primarySkill}
- Location: ${workerProfile.location}
${workerProfile.preferredJobTypes ? `- Preferred Job Types: ${workerProfile.preferredJobTypes.join(', ')}` : ''}

Suggest 3-4 types of jobs they could look for on our platform, with brief explanations of why these would be good matches based on their skill set and location. Format as a bulleted list.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I couldn't generate job recommendations right now. Please try again later.";
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    return "I'm having trouble generating job recommendations right now. Please try again later.";
  }
}

/**
 * Get worker hiring tips for employers
 * @param {Object} jobDetails Information about the job
 * @param {string} jobDetails.jobTitle The job title
 * @param {Array<string>} jobDetails.requiredSkills Array of required skills
 * @param {string} jobDetails.location The job location
 * @returns {Promise<string>} Personalized hiring tips
 */
export async function getHiringTips(jobDetails) {
  try {
    const prompt = `As WorkBuddy's AI assistant, provide hiring tips for an employer looking to hire for the following position:
- Job Title: ${jobDetails.jobTitle}
- Required Skills: ${jobDetails.requiredSkills.join(', ')}
- Location: ${jobDetails.location}

Provide 4-5 practical tips for finding and selecting the right worker for this job on our platform. Format as a numbered list.`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "I couldn't generate hiring tips right now. Please try again later.";
  } catch (error) {
    console.error("Error generating hiring tips:", error);
    return "I'm having trouble generating hiring tips right now. Please try again later.";
  }
}