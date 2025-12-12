# How to Use Cursor Agents — Magnus Sprint Orchestrator

## 🚀 Quick Answer

**The agent is already created and ready to use!** Here's how to access it:

---

## Method 1: Direct Chat (Easiest) ⭐

1. **Open Cursor** and make sure you're in your workspace (`Magnus-Flipper-AI-v1.0-pro-reset`)
2. **Open the Chat panel** (usually `Cmd+L` on Mac or `Ctrl+L` on Windows/Linux, or click the chat icon)
3. **Type the agent name or a trigger phrase**, for example:
   - `@Magnus Sprint Orchestrator`
   - `Start Sprint Execution — Phase 1`
   - `Plan next steps for Magnus Flipper sprint`

Cursor should automatically detect and use the agent based on the trigger phrases defined in the agent's examples.

---

## Method 2: Via Cursor Settings

1. **Open Cursor Settings**
   - Mac: `Cmd+,` (Command + Comma)
   - Windows/Linux: `Ctrl+,`
   - Or: `Cursor` → `Settings` (menu)

2. **Navigate to Agents** (or search for "agents" in settings)

3. **Import/Activate Agent**
   - Look for "Agents" or "Custom Agents" section
   - The agent file is already at: `.cursor/agents/magnus-sprint-orchestrator.json`
   - Cursor should auto-detect it, but you can manually import if needed

---

## Method 3: Command Palette

1. **Open Command Palette**
   - Mac: `Cmd+Shift+P`
   - Windows/Linux: `Ctrl+Shift+P`

2. **Type**: `agent` or `cursor agent`

3. **Select**: "Open Agent" or "Use Agent" and choose "Magnus Sprint Orchestrator"

---

## Method 4: Reference the Agent File Directly

If the above methods don't work, you can:

1. **Open the agent file** in Cursor:
   ```
   .cursor/agents/magnus-sprint-orchestrator.json
   ```

2. **Copy the system prompt** and paste it into a new chat, or

3. **Use the trigger phrases** from the examples section in the chat

---

## ✅ Verify It's Working

Once you've accessed the agent, try one of these prompts:

```
Start Sprint Execution — Phase 1
```

Or:

```
Plan next steps for Magnus Flipper sprint
```

**Expected Response:**
- The orchestrator should inspect your codebase
- Generate a Sprint Step Plan
- Provide code patches or delegation prompts
- Move forward with execution

---

## 🎯 Common Trigger Phrases

The orchestrator responds to these phrases (from the agent config):

- `Start Sprint Execution — Phase X` (where X is 1-8)
- `Resume Phase X at [area]`
- `Plan next steps for Magnus Flipper sprint`
- `Coordinate agents for [goal]`
- `Orchestrate a full flow for [feature]`

---

## 🔧 Troubleshooting

### Agent Not Detected?

1. **Check file location**: Ensure `.cursor/agents/magnus-sprint-orchestrator.json` exists
2. **Restart Cursor**: Sometimes agents need a restart to be detected
3. **Check Cursor version**: Make sure you're on a recent version that supports agents
4. **Manual activation**: Try copying the system prompt directly into chat

### Agent Not Responding Correctly?

1. **Use exact trigger phrases** from the examples
2. **Be specific** about which phase or feature you want
3. **Check the agent file** to see available tools and examples

### Can't Find Agents in Settings?

- Some Cursor versions have agents integrated into the chat system
- Try Method 1 (Direct Chat) first - it's usually the most reliable
- Agents might be accessed through the chat interface automatically

---

## 📋 Quick Test

**Copy and paste this into Cursor Chat:**

```
Start Sprint Execution — Phase 1

Coordinate:
- Phase 1: Figma System → Tokens → Base UI Kit

Inspect current state, create a comprehensive plan, and begin execution.
```

If the orchestrator responds with a Sprint Step Plan and starts inspecting your codebase, **it's working!** ✅

---

## 🆘 Still Having Issues?

1. **Check Cursor version**: Update to the latest version
2. **Verify agent file**: Open `.cursor/agents/magnus-sprint-orchestrator.json` to ensure it's valid JSON
3. **Try other agents**: Test with `magnus-component-contract-enforcer` to see if agents work at all
4. **Check Cursor docs**: Look for "Agents" or "Custom Agents" in Cursor's documentation

---

## 💡 Pro Tip

**The easiest way is usually Method 1**: Just open chat and type a trigger phrase. Cursor's AI will recognize the agent's purpose from the context and system prompt, even if it doesn't explicitly show "using agent X".

The agent file provides the system prompt and examples, which guide Cursor's behavior when you use those trigger phrases.

---

**Ready to orchestrate?** Try: `Start Sprint Execution — Phase 1` 🚀
