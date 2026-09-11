<!-- Built from data/prompts.json and locales/zh.json by `node scripts/build.mjs`.
     Edit the source, not this file; `--check` fails CI on a hand edit. -->

<p align="center" dir="ltr">
  <a href="README.md">English</a> ·
  <strong>中文</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.ar.md">العربية</a> ·
  <a href="README.pt.md">Português</a>
</p>

# GPT Image 2.5 提示词

<p align="center"><img src="images/examples/travel.webp" alt="Awesome GPT Image 2.5 prompts — cinematic image example generated on YouArt" width="960"></p>

[![License](https://img.shields.io/badge/license-see%20LICENSE-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![verify](https://github.com/youart-open-source/awesome-gpt-image-2-5-prompts/actions/workflows/verify.yml/badge.svg)](https://github.com/youart-open-source/awesome-gpt-image-2-5-prompts/actions/workflows/verify.yml)
![Prompts](https://img.shields.io/badge/prompts-150-111111.svg)

150 条可直接上手的提示词，面向 OpenAI 的 GPT Image 系列模型，含 GPT Image 2.5。每一条都按发布者的原文照录，并附上其账号和原帖链接。

150 条提示词 · 110 位署名创作者 · 9 个用途分类 · 其中 25 条以 JSON 编写 · 更新于 2026-09-10

**[打开生成器](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=hero&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=hero)**

GPT、GPT Image 和 ChatGPT 是 OpenAI 的商标。YouArt 是独立平台，与 OpenAI 没有关联，也未获得其背书。 GPT Image 2.5 仍在逐步开放，还没有对所有账号放开；等它开放时，这些提示词可以原封不动地迁过去。

<a id="what"></a>

## 这是什么

一份经过筛选、逐条署名的提示词库，收录的都是别人在 OpenAI 的 GPT Image 系列模型上跑过、并公开发布出来的提示词。分类按“你想做出什么”来分，而不是按风格，因为需求本身就是这个形状。每条提示词都保留原始措辞、作者，以及指向原帖的链接。

来源说清楚：这些提示词由这里署名的 110 位作者发布在 X 上，再由我们取材的两个开源仓库收集整理。在 149 条能确定日期的原帖里，有 144 条早于 GPT Image 2.5 在 2026-09-08 的发布。它们是自然语言提示词，不是模型专用语法，所以为 GPT Image 2 写的提示词在 2.5 上原样就能跑——我们宁愿这么讲，也不想把一批 GPT Image 2 时代的语料包装成 2.5 原生的，更没有声称这里的作者是在 2.5 上跑的。

<a id="how"></a>

## 怎么用

1. 在下面选一个用途，打开对应的文件。
2. 把代码块里的提示词整段复制走，不要改写——引号里的字符串就是为了让模型原样渲染出来的。
3. 把该属于你的那部分改掉：主体、文案、配色。然后跑起来。

其中 56 条仍保留着作者写在花括号里的模板占位符。运行前请把每一处都换成你自己的内容，否则模型会把占位符本身画进图里。

<a id="browse"></a>

## 按用途浏览

提示词本身不作翻译，一律保留作者写下的原文。提示词是喂给模型的输入，不是文章：这一代模型最为人称道的能力就是把引号里的字符串原样画进画面，翻译它就等于改掉了输出。

- **[海报](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=poster#poster)** — 电影预告海报、活动传单、旅行海报和专辑封面。这类提示词的篇幅大多花在构图和排版上，因为海报首先是一个构图问题，其次才是风格问题：标题落在哪里、它上方留多少留白、画面下三分之一由什么占据。 [打开这 17 条](prompts/gpt-image-2-5-poster-prompts.md)
- **[图中文字](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=typography-text#typography-text)** — 在画面里渲染出清晰可读的文字，是这一代模型最为人称道的能力。这类提示词会把要渲染的字符串原样引出来，点明字体的性格，并直接安排它在画面中的位置，而不是指望模型自己发挥。 [打开这 17 条](prompts/gpt-image-2-5-text-in-image-prompts.md)
- **[信息图](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=infographic#infographic)** — 图表、时间线、爆炸图和讲解页。篇幅长的那几条读起来几乎像一份规格说明：要几个标注、分布在哪一侧、标签文字写什么。这正是它们奏效的原因，也是其中不少干脆写成 JSON 的原因。 [打开这 17 条](prompts/gpt-image-2-5-infographic-prompts.md)
- **[UI 界面稿](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ui-mockup#ui-mockup)** — 仪表盘、移动端页面、落地页和直播画面框。UI 提示词必须点名它要哪些组件，否则模型会自己编出一套看着挺像回事的界面，而不是你心里想的那一套。 [打开这 17 条](prompts/gpt-image-2-5-ui-mockup-prompts.md)
- **[商品图](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ecommerce-product#ecommerce-product)** — 影棚商品图、包装渲染和目录图。这些是真正能回本的提示词：它们把布光方案、台面材质和机位说得足够精确，精确到能在一整条产品线上稳定复现。 [打开这 17 条](prompts/gpt-image-2-5-product-photo-prompts.md)
- **[广告创意](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=ad-creative#ad-creative)** — 营销主视觉、横幅和社交媒体广告素材。它们大多同时给出画面方向和一句要渲染进画面的文案——这也是它们属于这一代模型的原因，上一代连字都写不对。 [打开这 17 条](prompts/gpt-image-2-5-ad-creative-prompts.md)
- **[角色设定](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=character-design#character-design)** — 三视图、表情表、装备拆解和吉祥物。这里真正好用的套路是要一张设定图，而不是要一张画：把同一个角色的多个视角放进同一张图里，你拿到的才是一份能一直用下去的设计。 [打开这 16 条](prompts/gpt-image-2-5-character-design-prompts.md)
- **[人像](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=portrait#portrait)** — 杂志人像、形象照和电影质感摄影。它们的成败全在镜头调度上：画幅、焦段、光源和调色，比任何描述氛围的形容词都更管用。 [打开这 16 条](prompts/gpt-image-2-5-portrait-prompts.md)
- **[插画](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=category&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=illustration#illustration)** — 动漫、水彩、线稿、3D 渲染、等距视角和像素画。风格类提示词是全库里最短的，也是最值得改写的：换掉主体、留下风格那句，你就得到了一个系列。 [打开这 16 条](prompts/gpt-image-2-5-illustration-prompts.md)

<a id="guide"></a>

## 怎样写一条 GPT Image 2.5 提示词

整个提示词库里反复出现的六种写法。它们不是关于遣词造句的规矩，而是一些你不替模型做、模型就会替你做的决定——也是一条只灵一次的提示词和一条你能反复复用的提示词之间的差别。

### 先说清成品是什么，而不是画面里有什么

开头就写明最终成品「是」什么。「一张 16:9 的电影预告海报」和「一个女人在密室里的电影感场景」，同一段描述会给出完全不同的图，因为前者一上来就定下了画幅、用途和一整套约定俗成的做法。这个库里几乎每条提示词都是这样开头的。

### 先锁定构图，再谈风格

把东西的位置说出来：主体落在哪三分之一、页眉里填什么、分几栏、下方色带里有什么。风格形容词事后改起来很便宜；而没有指定的构图，正是你重生成五次也修不好的那个东西。

### 要出现的文字，用引号原样写出来

如果某段文字必须出现在画面里，就用引号把它写出来，并说明它放在哪。只做描述（「底部一行粗体标题」）换来的是一行字不对的粗体标题。这一代模型已经不会拼错字，所以失败的形态从鬼画符变成了「字很清楚，但不是你要的字」。

### 调度镜头，而不只是描述场景

画幅、角度、焦段、光源，以及调色。「35mm 胶片、正面硬闪、低角度四分之三侧」是一份规格；「电影感、有氛围」只是一个愿望。在能稳定复现的人像提示词和复现不了的那些之间，这一项造成的差别最大。

### 把配色限定死

三到四个叫得出名字的颜色，胜过任何描述情绪的词。这也是一条提示词能当模板用的关键：一条旅行海报提示词如果写明「海滨城市用水绿、珊瑚红与米白；山地城市用高山蓝与雪白」，它就从一张图变成了一个系列。

### 写清楚什么不能出现

结尾加一小段排除项是真的有用：不要水印、不要多余文字、角落不要露出太阳、皮肤不要塑料感。要短，要具体。一长串否定项会开始和正文描述争夺模型的注意力。

### 改图时，先说要改什么，再说要保留什么

先写清只有哪一处需要变，再列出必须保持不变的部分——主体、姿态、机位、光线、背景、风格。顺序颠倒会把真正的指令埋进细节里；一次提出三处改动，你就分不清是哪一处改变了结果。新加入的元素要和原图的透视、阴影、质感对齐，否则这处修改看起来就像贴上去的。

### 说明参考图是用来做什么的

这个模型最多接受十六张参考图，而“照这个来”并不是一条指令。写明参考图提供的是什么——主体、轮廓、配色、版式还是材质——以及其中哪些要延续到新图上。然后再描述你真正想要的场景或改动，因为参考图里并没有这部分内容。

### 一次只改一个变量，不要全改

把商品、角色或要传达的信息固定下来，只改动一个变量：两种打光方向、两种构图、两种风格。一组只在一处不同的图能告诉你是哪个决定起了作用；四张互不相关的图什么也说明不了。把能稳定复现的提示词留下来，它们就是下一次活动的模板。

<a id="rights"></a>

## 许可与署名

构建脚本是 MIT——随便 fork、商用，署上我们就算完。其余我们整理出来的部分暂时不开放授权；想用其中某块，问我们一声。

提示词和它们的标题是作者们的作品，不是我们的。每一行都署上了作者、链回原帖，原文我们一个字没改。我们没有逐条追查过背后的权利链，所以要拿某条用在重要的地方，署名那行会告诉你它属于谁。

其中某条是你写的、想撤下？说一声就撤，不用给理由。

[`LICENSE`](LICENSE) · [`ATTRIBUTION.md`](ATTRIBUTION.md) · [`TAKEDOWN.md`](TAKEDOWN.md)

<a id="json"></a>

## JSON 提示词格式

库里有一部分提示词写成的是 JSON 对象，而不是一段话。这既不是什么特殊的 API 模式，也不是隐藏功能：模型和读别的文本一样，把它当文本读。结构换来的是精确，以及更好改。

当画面里有几个必须彼此分开的部分时就用它：页眉、中心主体、一组带编号的标注、页脚。散文会把这些糊在一起，模型只能自己猜层级；用键把它们分开，提示词也就成了模板，因为改动一个值不会牵动它周围的整句话。如果是人像或单一主体的插画，散文更短，效果也一样好。

<a id="faq"></a>

## GPT Image 2.5 提示词常见问题

### 写给 GPT Image 2 的提示词能用在 GPT Image 2.5 上吗？

能。它们是自然语言提示词，不是某个模型专用的语法，所以为 GPT Image 2 写的提示词原样搬到 2.5 上照样跑得通，出图通常还更利落。这也是这个库从第一天起就有用的原因：模型换了，写提示词的方法沿用了下来。

### 提示词该写成 JSON 还是写成一段话？

只有一个主体的，写成一段话就够了：人像、插画、商品图。一旦画面里有必须彼此区分的部分，比如页眉、一组带编号的标注和页脚，就换成 JSON。模型对两者一视同仁，都是文本，所以 JSON 并不是什么特殊模式。它的价值在于让复杂的版面不产生歧义，并把提示词变成一个能逐项修改的模板。

### 怎样让文字在画面里正确渲染出来？

把确切的字符串用引号写出来，说明它在画面里的位置，再描述你想要的字体气质，而不是指定某个具体字体。只描述文字而不把它引出来，是「差一点就对了」的常见原因。这一代模型渲染图中文字的效果很好，中文和日文也在其列，所以剩下的失败大多来自提示词写得不够具体，而不是模型不会写字。

### 怎样让同一个角色在多张图里保持一致？

要一张角色设定图，而不是同一个角色的好几张图。一条同时要求正面、侧面、背面三视图，外加一排表情和一份装备拆解的提示词，会给你一份可以一直参照的稿子——这个库里的角色设定提示词用的就是这个套路。另一半靠参考图：模型可以同时接受多张，把设定图再喂回去，形象就稳得住。

### 这些提示词能在 YouArt 上运行吗？

能。把任意一条提示词复制到 GPT Image 2 里——那是 YouArt 今天提供的 OpenAI 图像模型——它会原样跑通。GPT Image 2.5 仍在逐步开放，还没有对所有账号放开；等它开放时，这些提示词可以原封不动地迁过去。

### 改图时该怎么写 GPT Image 2.5 提示词？

先描述你想要的那一处改动，再点明需要保留的细节——主体、姿态、光线、机位，以及任何不能移动的商品细节。每改一次就看一遍结果，这样每处变化都能对应到你提出的某个要求；一次性提交一批修改就做不到这一点。

### GPT Image 2.5 提示词可以配参考图使用吗？

可以，而且模型最多接受十六张。不要只说“照着这张来”，而要说明参考图提供了什么：一个主体、一条轮廓、一套配色、一种构图，或是一种材质。然后指出哪些特征必须延续下来，再描述你想在此基础上加入的新场景或改动。

### 该写一条长提示词，还是分几次修改？

第一张图先给出完整的需求描述，之后针对需要调整的部分做有针对性的修改。这样既保住了已经成立的部分，也让每次输出都能和上一次对比。构图、光线、文字和造型如果都需要处理，就分成几次修改分别来做。

### AI 图像生成工具的提示词该怎么写？

按观看者注意到画面的顺序来写：主体、场景、构图、风格、光线，最后是必须保持一致的细节。如果成图里带有文字、版式或商品信息，就直接给出确切的字句，并说明它在视觉层级中的位置，而不是去描述它。

<a id="machines"></a>

## 给大模型和智能体

GitHub 只在单个文件页面上把提示词全文交给不做渲染的抓取程序，仓库首页并不会。所以机器可读的副本都列在下面，并标出各自的体积。

| 内容 | 文件 | 字节 |
|---|---|--:|
| 全部提示词 | [`data/prompts.json`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/data/prompts.json) | 496,998 |
| 给大模型和智能体 | [`llms.txt`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/llms.txt) | 11,022 |
| 海报 | [`prompts/gpt-image-2-5-poster-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-poster-prompts.md) | 60,016 |
| 图中文字 | [`prompts/gpt-image-2-5-text-in-image-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-text-in-image-prompts.md) | 38,349 |
| 信息图 | [`prompts/gpt-image-2-5-infographic-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-infographic-prompts.md) | 70,351 |
| UI 界面稿 | [`prompts/gpt-image-2-5-ui-mockup-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-ui-mockup-prompts.md) | 41,745 |
| 商品图 | [`prompts/gpt-image-2-5-product-photo-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-product-photo-prompts.md) | 45,681 |
| 广告创意 | [`prompts/gpt-image-2-5-ad-creative-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-ad-creative-prompts.md) | 60,933 |
| 角色设定 | [`prompts/gpt-image-2-5-character-design-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-character-design-prompts.md) | 50,346 |
| 人像 | [`prompts/gpt-image-2-5-portrait-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-portrait-prompts.md) | 54,404 |
| 插画 | [`prompts/gpt-image-2-5-illustration-prompts.md`](https://raw.githubusercontent.com/youart-open-source/awesome-gpt-image-2-5-prompts/main/prompts/gpt-image-2-5-illustration-prompts.md) | 58,486 |

面向助手的索引，惯例地址是站点自己的 llms.txt，那里已经收录了这个提示词库。本仓库里的这份是它的镜像。 [`llms.txt`](llms.txt)

引用某条提示词时，请把它的作者和原帖链接一并带上。

<a id="cta"></a>

## 把这些提示词跑起来

复制一条提示词，粘进输入框，再把该属于你的那部分改掉。无需任何配置，还有免费额度可以先试。

**[打开生成器](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=footer)** · [在 youart.ai 上浏览全部 150 条](https://youart.ai/zh/gpt-image-2-5-prompts?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=footer)

<a id="about"></a>

## 关于

由 YouArt 维护；YouArt 是 Formative Intelligence Inc. 的产品。

YouArt 是一个 AI 图像与视频创作平台。这 150 条提示词在站上也有一份，配了一键填入的输入框，不用做任何配置就能直接跑，还有免费额度可以先试。

[youart.ai](https://youart.ai/zh/?utm_source=github&utm_medium=footer&utm_campaign=awesome-gpt-image-2-5-prompts&utm_content=brand)
