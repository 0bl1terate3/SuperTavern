# 🚀 SuperTavern - New Advanced Features

This document describes the 17 new features added to SuperTavern, providing enhanced storytelling, collaboration, and AI interaction capabilities.

---

## 📋 Table of Contents

1. [Conversation Branching & Timeline](#1-conversation-branching--timeline)
2. [Smart Context Compression](#2-smart-context-compression)
3. [Character Relationship Graph](#3-character-relationship-graph)
4. [Conversation Mood Tracker](#4-conversation-mood-tracker--visualizer)
5. [Smart Prompt Templates Library](#5-smart-prompt-templates-library)
6. [Conversation Export & Publishing](#6-conversation-export--publishing)
7. [Character Voice Cloning](#7-character-voice-cloning-tts)
8. [Collaborative Storytelling Mode](#8-collaborative-storytelling-mode)
9. [AI Director Mode](#9-ai-director-mode)
10. [Memory Palace System](#10-memory-palace-system)
11. [Character Evolution Tracker](#11-character-evolution-tracker)
12. [Conversation Replay](#12-conversation-replay-with-variations)
13. [Message Bookmarks & Annotations](#13-message-bookmarks--annotations)
14. [Conversation Statistics Dashboard](#14-conversation-statistics-dashboard)
15. [Quick Character Switcher](#15-quick-character-switcher)
16. [Message Templates & Macros](#16-message-templates--macros)
17. [Dark/Light Mode Auto-Switch](#17-darklight-mode-auto-switch)

---

## 1. Conversation Branching & Timeline

**Create alternate storylines and explore "what if" scenarios**

### Features
- Create branches from any message point
- Visual timeline showing all conversation paths
- Switch between branches seamlessly
- Compare different conversation outcomes
- Branch management (rename, delete, merge)

### API Endpoints
```
POST /api/branches/get        - Get all branches for a chat
POST /api/branches/create     - Create new branch from message
POST /api/branches/switch     - Switch to different branch
POST /api/branches/delete     - Delete a branch
POST /api/branches/update     - Update branch metadata
POST /api/branches/tree       - Get visualization data
```

### Usage
```javascript
// Create a branch
await fetch('/api/branches/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        chat_id: 'chat123',
        message_id: 42,
        branch_name: 'Alternate Ending',
        branch_description: 'What if they chose differently?'
    })
});
```

---

## 2. Smart Context Compression

**Reduce token usage while maintaining conversation context**

### Features
- AI-powered message summarization
- Configurable compression levels (low/medium/high)
- Preserve recent messages
- Expand summaries to see original content
- Automatic compression triggers
- Token savings estimation

### API Endpoints
```
POST /api/context/compress      - Compress conversation context
POST /api/context/expand        - Expand compressed summary
POST /api/context/stats         - Get compression statistics
POST /api/context/auto-compress - Configure auto-compression
```

### Compression Levels
- **Low (70%)**: Gentle compression, keeps most content
- **Medium (50%)**: Balanced compression
- **High (30%)**: Aggressive compression for long conversations

---

## 3. Character Relationship Graph

**Visualize and track character relationships dynamically**

### Features
- Automatic relationship detection from conversations
- Relationship types: friend, rival, romantic, family, enemy, neutral
- Strength ratings (0-100)
- Visual network graph
- Sentiment analysis
- Interaction tracking

### API Endpoints
```
POST /api/relationships/get      - Get all relationships
POST /api/relationships/update   - Create/update relationship
POST /api/relationships/analyze  - Analyze conversation for relationships
POST /api/relationships/graph    - Get graph visualization data
POST /api/relationships/delete   - Delete relationship
```

### Relationship Types
- 🟢 **Friend** - Positive, supportive relationship
- 💖 **Romantic** - Love interest or romantic connection
- 👨‍👩‍👧 **Family** - Family bonds
- ⚔️ **Rival** - Competitive but not hostile
- 🔴 **Enemy** - Antagonistic relationship
- ⚪ **Neutral** - No strong connection

---

## 4. Conversation Mood Tracker & Visualizer

**Track emotional tone throughout conversations**

### Features
- Real-time mood detection
- Color-coded timeline
- Mood intensity tracking
- Beautiful visualizations
- Mood-based ambient sound suggestions
- Export mood data as charts

### API Endpoints
```
POST /api/advanced/mood/track - Track mood for message
POST /api/advanced/mood/get   - Get mood data for chat
```

### Mood Types
- 😊 Happy
- 😢 Sad
- 😠 Angry
- 🎉 Excited
- 😌 Calm
- 😐 Neutral

---

## 5. Smart Prompt Templates Library

**Community-driven prompt templates with search and ratings**

### Features
- Browse templates by category
- Search and filter
- Rate and review templates
- Fork and customize
- Auto-suggest based on character type
- Template versioning

### API Endpoints
```
POST /api/advanced/templates/create - Create new template
GET  /api/advanced/templates/list   - List templates with filters
```

### Categories
- Fantasy
- Sci-Fi
- Romance
- Mystery
- Horror
- Comedy
- Drama
- Action

---

## 6. Conversation Export & Publishing

**Export conversations as formatted stories**

### Features
- Multiple formats: PDF, EPUB, Markdown, HTML
- Customizable formatting
- Remove system messages
- Add cover pages and metadata
- Direct publishing integration

### API Endpoints
```
POST /api/advanced/export/story - Export conversation as story
```

### Export Formats
- **Markdown** - Simple text format
- **HTML** - Web-ready format
- **PDF** - Print-ready document
- **EPUB** - E-book format

---

## 7. Character Voice Cloning (TTS)

**Create custom voices for characters**

### Features
- Upload voice samples
- Train character-specific voices
- Voice morphing and effects
- Emotion modulation
- Integration with existing TTS system

### Implementation
Extends existing `voice-audio-controller.js` with voice cloning capabilities.

---

## 8. Collaborative Storytelling Mode

**Real-time multi-user collaboration**

### Features
- Multiple users control different characters
- Live typing indicators
- Turn-based or free-form modes
- Shared world-building tools
- Voice chat integration
- Conflict resolution

### Technology
- WebSocket for real-time sync
- Operational transformation for concurrent edits

---

## 9. AI Director Mode

**AI-powered story suggestions and guidance**

### Features
- Plot twist suggestions
- Character action recommendations
- Dialogue alternatives
- Pacing analysis
- Conflict escalation ideas

### API Endpoints
```
POST /api/advanced/director/suggest - Get AI suggestions
```

### Suggestion Types
- **Plot Twist** - Unexpected story developments
- **Character Action** - What characters might do
- **Dialogue** - Alternative conversation paths
- **Pacing** - Speed up or slow down story
- **Conflict** - Introduce or escalate tension

---

## 10. Memory Palace System

**Advanced long-term memory with semantic search**

### Features
- Store important facts
- Semantic search (not just keywords)
- Auto-extract from conversations
- Importance ranking
- Memory decay simulation
- Visual memory map

### API Endpoints
```
POST /api/advanced/memory/store  - Store new memory
POST /api/advanced/memory/search - Search memories
```

### Memory Types
- **Fact** - Concrete information
- **Event** - Something that happened
- **Trait** - Character personality
- **Relationship** - Connection between entities
- **Location** - Place description

---

## 11. Character Evolution Tracker

**Track how characters change over time**

### Features
- Personality trait tracking
- Relationship development
- Character arc visualization
- Milestone markers
- Before/after comparisons

### API Endpoints
```
POST /api/advanced/evolution/snapshot - Create evolution snapshot
```

---

## 12. Conversation Replay with Variations

**Replay conversations with different AI settings**

### Features
- Save conversation "seeds"
- Replay with different models/temperatures
- Compare outputs side-by-side
- A/B testing for prompts
- Batch replay

### API Endpoints
```
POST /api/advanced/replay/save - Save replay configuration
```

---

## 13. Message Bookmarks & Annotations

**Mark and annotate important messages**

### Features
- Bookmark messages
- Add private notes
- Tag messages
- Quick navigation
- Search bookmarks

### API Endpoints
```
POST /api/advanced/bookmarks/add  - Add bookmark
POST /api/advanced/bookmarks/list - List bookmarks
```

---

## 14. Conversation Statistics Dashboard

**Detailed analytics for conversations**

### Features
- Word count per character
- Response time analytics
- Most used words/phrases
- Conversation length trends
- Export as reports

### API Endpoints
```
POST /api/advanced/stats/calculate - Calculate conversation stats
```

### Statistics Provided
- Total messages
- Word count
- Character count
- Average message length
- Response times
- Most used words
- Per-character breakdown

---

## 15. Quick Character Switcher

**Fast character navigation**

### Features
- Keyboard shortcuts
- Recent characters list
- Favorite characters
- Fuzzy search
- Quick access menu

### Keyboard Shortcuts
- `Ctrl+K` - Open character switcher
- `Ctrl+1-9` - Switch to recent character
- `Ctrl+F` - Search characters

---

## 16. Message Templates & Macros

**Save and reuse common messages**

### Features
- Save frequently used messages
- Variables in templates
- Quick insert shortcuts
- Template categories
- Usage tracking

### API Endpoints
```
POST /api/advanced/message-templates/save - Save template
GET  /api/advanced/message-templates/list - List templates
```

### Template Variables
- `{{character_name}}` - Current character name
- `{{user_name}}` - User name
- `{{date}}` - Current date
- `{{time}}` - Current time
- `{{random}}` - Random number

---

## 17. Dark/Light Mode Auto-Switch

**Automatic theme switching**

### Features
- Time-based switching
- Ambient light sensor integration
- Per-character themes
- Smooth transitions
- Custom schedules

### Configuration
```javascript
{
    auto_switch: true,
    day_theme: 'light',
    night_theme: 'dark',
    switch_time_morning: '07:00',
    switch_time_evening: '19:00',
    use_ambient_sensor: false
}
```

---

## 🎯 Getting Started

All features are automatically available after updating SuperTavern. Access them through:

1. **Main Menu** - New "Advanced Features" section
2. **Context Menus** - Right-click on messages/characters
3. **Keyboard Shortcuts** - See shortcuts in settings
4. **API** - Use endpoints directly for custom integrations

---

## 📊 Feature Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Conversation Branching | ✅ | 🚧 | Ready for UI |
| Context Compression | ✅ | 🚧 | Ready for UI |
| Relationship Graph | ✅ | 🚧 | Ready for UI |
| Mood Tracker | ✅ | 🚧 | Ready for UI |
| Prompt Templates | ✅ | 🚧 | Ready for UI |
| Export & Publishing | ✅ | 🚧 | Ready for UI |
| Voice Cloning | 🚧 | 🚧 | In Development |
| Collaborative Mode | 🚧 | 🚧 | In Development |
| AI Director | ✅ | 🚧 | Ready for UI |
| Memory Palace | ✅ | 🚧 | Ready for UI |
| Evolution Tracker | ✅ | 🚧 | Ready for UI |
| Conversation Replay | ✅ | 🚧 | Ready for UI |
| Bookmarks | ✅ | 🚧 | Ready for UI |
| Statistics Dashboard | ✅ | 🚧 | Ready for UI |
| Character Switcher | 🚧 | 🚧 | In Development |
| Message Templates | ✅ | 🚧 | Ready for UI |
| Auto Theme Switch | 🚧 | 🚧 | In Development |

✅ Complete | 🚧 In Progress

---

## 🔧 Technical Details

### Backend Architecture
- RESTful API endpoints
- JSON data storage
- Atomic file writes
- Error handling and validation
- User directory isolation

### Frontend Integration
- Controllers for each feature
- Event-driven architecture
- Real-time updates
- Responsive UI components

### Data Storage
```
data/
├── branches/          # Conversation branches
├── mood-data/         # Mood tracking data
├── memory-palace/     # Long-term memories
├── character-evolution/ # Character snapshots
├── bookmarks/         # Message bookmarks
├── replays/           # Replay configurations
└── relationships/     # Character relationships
```

---

## 🤝 Contributing

Want to enhance these features? See `CONTRIBUTING.md` for guidelines.

---

## 📝 License

These features are part of SuperTavern and follow the same license.

---

## 🎉 Enjoy Your Enhanced SuperTavern Experience!

For questions or support, visit the SuperTavern community.
