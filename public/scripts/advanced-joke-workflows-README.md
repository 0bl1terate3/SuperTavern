# 🎭 Advanced Joke Workflows - Topic → Joke Generation System

A comprehensive system implementing 6 advanced methods for sophisticated joke generation in SillyTavern.

## 🚀 Features

### 1. Stepped Thinking with Topic Pools
- **Two-phase generation**: Topic Selection → Joke Construction
- **Rotating topic pools**: Current events, pop culture, everyday life, absurd scenarios
- **Auto-rotation**: Automatically cycles through different topic categories
- **Custom topic pools**: Add your own topic categories

### 2. Guided Generations with Role Segmentation
- **Role-based generation**: Split AI task into specialized roles
- **Module chaining**: One module's output becomes the next's input
- **Customizable modules**: Define your own role-based workflows
- **Example workflow**: Topic Selector → Comedian

### 3. Objective-Driven Joke Variations
- **Rotating objectives**: Pun, dark humor, dad jokes, pop culture, absurd, wordplay, situational, parody
- **Auto-rotation**: Automatically cycles through different joke objectives
- **Custom objectives**: Add your own joke objectives
- **Objective templates**: Pre-defined prompts for each objective type

### 4. Memory-Integrated Humor
- **Chat memory extraction**: Harvest topics from recent conversations
- **Lorebook integration**: Extract topics from character lorebook and world info
- **Smart topic selection**: Use contextually relevant topics instead of random ones
- **Memory management**: Configurable memory limits and cleanup

### 5. Topic Roulette with SwipeModelRoulette
- **Swipe to rotate**: Every swipe selects a new joke topic
- **Pool rotation**: Cycle through different topic pools
- **Visual feedback**: See current topic pool in real-time
- **Custom pools**: Define your own topic pools for rotation

### 6. Joke Scaffolding via Prompt Inspector
- **Structure enforcement**: Force specific joke structures
- **Scaffolding templates**: Pre-defined templates for different joke types
- **Prompt injection**: Automatically inject scaffolding into prompts
- **Structure rotation**: Cycle through different joke structures

## 🎯 Slash Commands

### Main Commands
- `/advancedjoke [context] [method]` - Generate joke using all advanced methods
- `/steppedjoke [context]` - Generate joke with stepped thinking
- `/guidedjoke [context]` - Generate joke with guided generations
- `/objectivejoke [context]` - Generate joke with objective-driven variations
- `/memoryjoke [context]` - Generate joke with memory integration
- `/scaffoldjoke [context]` - Generate joke with scaffolding

### Utility Commands
- `/rotatetopic` - Rotate topic pool
- `/currenttopic` - Show current topic pool
- `/memorytopics` - Show memory topics
- `/clearmemory` - Clear memory topics

### Aliases
- `/ajoke`, `/smartjoke` → `/advancedjoke`
- `/stepjoke`, `/thinkjoke` → `/steppedjoke`
- `/guidejoke`, `/rolejoke` → `/guidedjoke`
- `/objjoke`, `/goaljoke` → `/objectivejoke`
- `/memjoke`, `/brainjoke` → `/memoryjoke`
- `/scaffjoke`, `/structjoke` → `/scaffoldjoke`

## ⚙️ Configuration

### Extension Settings
Access via Extensions menu → Advanced Joke Workflows

#### Stepped Thinking
- **Enable/Disable**: Toggle stepped thinking method
- **Topic Pools**: Select which topic pools to use
- **Auto-rotate**: Automatically rotate through pools

#### Guided Generations
- **Enable/Disable**: Toggle guided generations method
- **Role Segmentation**: Enable role-based generation
- **Custom Modules**: Define custom role workflows

#### Objective-Driven
- **Enable/Disable**: Toggle objective-driven method
- **Objectives**: Select which objectives to use
- **Auto-rotate**: Automatically rotate through objectives

#### Memory Integration
- **Enable/Disable**: Toggle memory integration
- **Use Chat Summaries**: Extract topics from chat
- **Use Lorebook**: Extract topics from lorebook
- **Max Topics**: Maximum topics to remember

#### Topic Roulette
- **Enable/Disable**: Toggle topic roulette
- **Swipe to Rotate**: Rotate topics on swipe
- **Pools**: Select pools for rotation

#### Joke Scaffolding
- **Enable/Disable**: Toggle joke scaffolding
- **Enforce Structure**: Force specific structures
- **Structures**: Select joke structures to use

## 🔧 Technical Implementation

### Core Architecture
```javascript
class AdvancedJokeWorkflows {
    constructor() {
        this.currentTopicPool = 'everyday_life';
        this.currentObjective = 'pun';
        this.currentStructure = 'one_liner';
        this.topicRotation = 0;
        this.objectiveRotation = 0;
        this.structureRotation = 0;
        this.memoryTopics = [];
        this.chatSummaryTopics = [];
    }
}
```

### Topic Pools
```javascript
const TOPIC_POOLS = {
    current_events: ["artificial intelligence", "climate change", ...],
    pop_culture: ["superhero movies", "streaming services", ...],
    everyday_life: ["coffee addiction", "traffic jams", ...],
    absurd_scenarios: ["zombie apocalypse", "time travel", ...]
};
```

### Joke Structures
```javascript
const JOKE_STRUCTURES = {
    one_liner: "Create a single, punchy joke about {topic}",
    setup_punchline: "Create a setup-punchline joke about {topic}",
    parody: "Create a parody joke about {topic}",
    dialogue: "Create a dialogue joke between two characters about {topic}",
    absurdism: "Create an absurd, impossible scenario joke about {topic}",
    wordplay: "Create a pun or wordplay joke about {topic}",
    dark_humor: "Create a dark humor joke about {topic}",
    dad_joke: "Create a dad joke about {topic}"
};
```

### Objective Templates
```javascript
const JOKE_OBJECTIVES = {
    pun: "Make a clever pun about {topic}",
    dark: "Tell a dark joke about {topic}",
    dad: "Make a dad joke about {topic}",
    pop_culture: "Blend {topic} with pop culture references",
    absurd: "Make an absurd, impossible scenario joke about {topic}",
    wordplay: "Use clever wordplay with {topic}",
    situational: "Create situational comedy about {topic}",
    parody: "Parody something well-known using {topic}"
};
```

## 🎨 Usage Examples

### Basic Usage
```
/advancedjoke
/steppedjoke about coffee
/memoryjoke
/scaffoldjoke about technology
```

### Advanced Usage
```
/advancedjoke about AI development stepped
/objectivejoke about climate change
/guidedjoke about superhero movies
```

### Utility Commands
```
/rotatetopic
/currenttopic
/memorytopics
/clearmemory
```

## 🔄 Workflow Examples

### Stepped Thinking Workflow
1. **Topic Selection**: AI selects from configured topic pools
2. **Joke Construction**: AI creates joke based on selected topic
3. **Result**: Contextually relevant, well-structured joke

### Guided Generations Workflow
1. **Topic Selector Role**: "Pick a random funny topic for a joke"
2. **Comedian Role**: "Make a one-liner joke about [selected topic]"
3. **Result**: Role-specialized joke generation

### Memory Integration Workflow
1. **Extract Topics**: From recent chat conversations
2. **Select Topic**: From memory topics or fallback to pools
3. **Generate Joke**: Using memory-relevant topic
4. **Result**: Contextually aware joke

### Topic Roulette Workflow
1. **Swipe Event**: User swipes to generate new response
2. **Pool Rotation**: System rotates to next topic pool
3. **Topic Selection**: Random topic from new pool
4. **Joke Generation**: Joke based on new topic
5. **Result**: Fresh joke with different topic focus

## 🎯 Best Practices

### Topic Pool Management
- Use diverse topic pools for variety
- Regularly update topic pools with current events
- Balance between familiar and novel topics

### Memory Integration
- Enable chat summaries for contextual relevance
- Use lorebook integration for character-specific humor
- Regularly clear old memory topics to prevent staleness

### Structure Rotation
- Enable auto-rotation for variety
- Use multiple structures for different joke types
- Balance between simple and complex structures

### Objective Management
- Use diverse objectives for humor variety
- Enable auto-rotation for surprise
- Customize objectives for your humor preferences

## 🐛 Troubleshooting

### Common Issues
1. **Jokes not generating**: Check if extension is enabled
2. **Memory topics not updating**: Check memory integration settings
3. **Topic rotation not working**: Check topic roulette settings
4. **Scaffolding not injecting**: Check Prompt Inspector integration

### Debug Commands
- `/currenttopic` - Check current topic pool
- `/memorytopics` - Check memory topics
- `/clearmemory` - Reset memory topics

## 🔮 Future Enhancements

### Planned Features
- **Custom topic pools**: User-defined topic categories
- **Joke templates**: User-defined joke structure templates
- **Humor preferences**: Personalized humor style settings
- **Analytics**: Joke generation statistics and insights
- **Integration**: Better integration with other SillyTavern features

### Advanced Features
- **Machine learning**: Learn from user preferences
- **Context awareness**: Better understanding of conversation context
- **Multi-language**: Support for different languages
- **Voice integration**: Voice-based joke generation

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

## 📞 Support

For support and questions:
- GitHub Issues: [Repository Issues](https://github.com/SillyTavern/SillyTavern/issues)
- Discord: [SillyTavern Discord](https://discord.gg/sillytavern)
- Documentation: [SillyTavern Docs](https://docs.sillytavern.com)

---

**Made with ❤️ for the SillyTavern community**
