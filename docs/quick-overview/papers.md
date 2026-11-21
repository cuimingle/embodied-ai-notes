# 具身智能分方向必读论文，从四类任务选起

具身智能快速概览 · 第四篇

如果你想知道机器人怎样夹起一件没见过的物品，第一篇可以读 Dex-Net 2.0。如果你关心双臂怎么配合着插入一块电池，从 ACT 开始更直接。两篇都在讲机械臂，前者要给一个抓姿打分，后者要连续输出一串动作。**先选自己想解释的现象，再选论文，读起来会轻松很多。**

下面选了 13 篇原始研究。前四个方向沿用抓取、操作、运动和导航，每个方向都给一篇首读。后面五个方向供按需查阅，分别追问机器人怎样定位、数据从哪里来、语言如何接到动作、怎样预想后果，以及长任务如何验收。入选依据是论文能否把一个问题讲清、能否找到对应实验。涉及结果时，以作者实际测试的硬件、任务和环境为准。

## 从四类任务开始

### 抓取｜怎样决定从哪里下手？

**首读 Dex-Net 2.0**，Jeffrey Mahler 等，RSS 2017。把论文图 1 里的候选夹爪挨个看一遍。网络接收深度图，估计不同两指抓姿能否成功，训练用的抓取质量来自合成几何和物理分析。最值得细看的是实物实验的分母。对 40 件新物品，文中常被引用的 99% 指判为可靠的 69 次抓取中有 68 次成功。看到这个数字，就应该继续问系统把多少候选判成了可靠。论文的主要设置是桌面上单独放置的物体和一个平行夹爪。[Dex-Net 2.0: Deep Learning to Plan Robust Grasps with Synthetic Point Clouds and Analytic Grasp Metrics](https://roboticsproceedings.org/rss13/p58.html)

### 操作｜一连串动作怎样协调起来？

**首读 ACT**，Tony Z. Zhao 等，RSS 2023。看插电池时两只手分别在做什么，再看方法图中的动作块。模型一次预测多步，后续观测仍能更新要执行的动作。读实验视频时留意片段由人遥操还是由策略独立完成，判断依据是作者给的标注，两者在熟练时看起来都很流畅。[Learning Fine-Grained Bimanual Manipulation with Low-Cost Hardware](https://www.roboticsproceedings.org/rss19/p016.html)

**对照读 Diffusion Policy**，Cheng Chi 等，RSS 2023。同一张图里，手可以沿不同路线完成任务。作者把未来动作序列作为生成对象，在视觉条件下逐步去噪，执行序列的前一段，再取得新观测。读方法图时分别标出“看了几帧”“预测几步”“执行几步”。这三个长度决定了策略能利用多少历史、能规划多远、多久有机会纠错。[Diffusion Policy: Visuomotor Policy Learning via Action Diffusion](https://www.roboticsproceedings.org/rss19/p026.html)

下面用一个桌面例子说明为什么保留多种可行轨迹很重要。两条示范都能带着夹爪绕过立柱。先沿上方示范走一遍，再选“逐点平均两条示范”，单步看看平均路线在哪里碰壁。动画只计算这三条几何轨迹，论文中的去噪模型需要用示范训练。

<div class="overview-demo" data-overview-scene="trajectories"></div>

### 运动｜四足机器人怎样学会走稳？

**首读 Rudin 等的并行行走训练**，CoRL 2021，论文集于 2022 年出版。看地形课程怎样随表现提高难度，再看训练好的策略装到真实 ANYmal 后，究竟读取什么、输出什么。标题里的“几分钟”是数千台虚拟机器人并行采样的墙钟时间。判断学习效率时，还要看它们合计产生了多少次交互。[Learning to Walk in Minutes Using Massively Parallel Deep Reinforcement Learning](https://proceedings.mlr.press/v164/rudin22a.html)

### 导航｜第一次进一间屋子，该去哪里找椅子？

**首读 SemExp**，Devendra Singh Chaplot 等，NeurIPS 2020。沿图 2 追一遍椅子还没有出现在画面里时的决策。机器人一边走一边把看见的物体和可通行区域放进语义地图，再按目标类别选择下一处值得探索的位置，局部规划器负责到那里。读评测表时并排看能否找到目标与路径效率。它们分别反映目的地是否正确、路走得是否经济。[Object Goal Navigation using Goal-Oriented Semantic Exploration](https://arxiv.org/abs/2007.00643)

## 顺着兴趣，往方法和系统里走

### 几何感知与状态估计｜机器人凭什么记住来路？

**ORB-SLAM**，Raúl Mur-Artal 等，IEEE Transactions on Robotics，2015。跟着相机走一圈，观察系统再次认出旧地点后怎样修正积累的漂移。把相机跟踪、局部建图和闭环校正放回这段行程里，就容易看懂三个模块的分工。原始单目系统恢复的地图带有尺度不确定性，要把距离换算成米，还需要额外参照。[ORB-SLAM: A Versatile and Accurate Monocular SLAM System](https://arxiv.org/abs/1502.00956)

### 示范与跨机器人数据｜人的动作怎样变成机器人的训练样本？

**UMI**，Cheng Chi、Zhenjia Xu 等，RSS 2024。先看操作者手里的夹爪，再读轨迹怎样表示、采集与部署的延迟怎样匹配。它给“从人学”加上了可检查的前提。人拿着专门装置演示时，系统能保留夹爪的运动和开合信息；随手拍的一段视频，提供的监督信号会少很多。[Universal Manipulation Interface: In-The-Wild Robot Teaching Without In-The-Wild Robots](https://roboticsproceedings.org/rss20/p045.html)

**Open X-Embodiment**，Open X-Embodiment Collaboration，ICRA 2024。从数据表挑两个不同的机器人，看它们各自记录了什么动作，再读 RT-X 的跨平台联合训练实验。其他机器人的示范能给某些任务带来正迁移，而动作坐标、尺度和控制器的差别依然要处理。这是理解“统一格式”和“共享技能”之间还隔着哪些工作的好例子。[Open X-Embodiment: Robotic Learning Datasets and RT-X Models](https://arxiv.org/abs/2310.08864)

### 视觉—语言—动作模型｜一句新指令怎样改变动作？

**RT-2**，RT-2 团队，CoRL 2023。先看训练样例怎样把动作编码成离散 token，再看语义泛化实验。读一个成功案例时拆成两个问题。机器人是不是听懂了新的目标？完成它所需的抓取动作是否已经具备？这样才能看清视觉语言预训练贡献了什么。[RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control](https://proceedings.mlr.press/v229/zitkovich23a.html)

**π₀**，Kevin Black 等，RSS 2025，预印本发表于 2024 年。与 RT-2 对读动作输出这一段。π₀ 把视觉语言模型接到生成连续动作块的模块上，用流匹配学习动作的生成过程。读结果时先标明该任务是直接执行，还是经过任务数据微调。两种条件回答的泛化问题不同。[π₀: A Vision-Language-Action Flow Model for General Robot Control](https://roboticsproceedings.org/rss21/p010.html)

### 世界模型与规划｜机器人能否先预想推一下的结果？

**Deep Visual Foresight**，Chelsea Finn、Sergey Levine，ICRA 2017。人在第一帧点出物体上的一点和它该去的位置，系统用视频预测模型比较几种推法，执行后再规划。读完方法就翻图 6 的失败案例。手臂遮住了被跟踪的点，即使后续画面看起来合理，规划也可能继续推错。对这项桌面任务，终点偏差比单看片段是否逼真更能检验模型是否有用。[Deep Visual Foresight for Planning Robot Motion](https://arxiv.org/abs/1610.00696)

### 语言规划与长程评测｜每一步都合理，整件事完成了吗？

**SayCan**，Ichter 等，CoRL 2022，论文集于 2023 年出版。拿一条厨房指令，顺着候选技能往下看。语言模型评估此时做哪件事有助于完成指令，技能价值函数评估机器人眼下有多大把握做成。最后对照计划是否合理与真机执行是否成功。技能库里有哪些动作，直接限定了它能执行的计划。[Do As I Can, Not As I Say: Grounding Language in Robotic Affordances](https://proceedings.mlr.press/v205/ichter23a.html)

**ALFRED**，Mohit Shridhar 等，CVPR 2020。读第 5.1 节对日常指令的评分。如果任务要求把加热过的土豆片放到台面，切了片、放对位置，却漏了加热，若干子目标可以得分，整项任务仍然失败。论文在模拟环境中把导航与物体交互连成一个过程，很适合用来理解单项技能的成绩为何无法直接当作整条指令的成功率。[ALFRED: A Benchmark for Interpreting Grounded Instructions for Everyday Tasks](https://openaccess.thecvf.com/content_CVPR_2020/html/Shridhar_ALFRED_A_Benchmark_for_Interpreting_Grounded_Instructions_for_Everyday_Tasks_CVPR_2020_paper.html)

如果只留一个下午，挑自己最关心的任务，读它的首篇，把**机器人看到了什么、可以做什么、谁来判断成功、在哪种情况下会失败**写在一张纸上。然后回来看第二篇的同一个动画，指出动画省略了论文里的哪一个困难。能说出这个差别，就已经跨过了从“记得模型名字”到“读得懂实验”的一步。

上一篇：[具身智能的主要技术栈](stack.md) · 从头阅读：[什么是具身智能](concept.md)
