import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const DURATION = 45 * FPS;

const colors = {
  ink: "#0f172a",
  slate: "#475569",
  muted: "#64748b",
  line: "#dbe4ea",
  paper: "#fbfbf8",
  white: "#ffffff",
  teal: "#0f766e",
  tealSoft: "#ccfbf1",
  tealMist: "#f0fdfa",
  blue: "#2563eb",
  amber: "#ca8a04",
  rose: "#e11d48",
  skySoft: "#eff6ff",
};

const sceneStarts = {
  hook: 0,
  brand: 5 * FPS,
  feedback: 10 * FPS,
  rewrite: 17 * FPS,
  exam: 24 * FPS,
  dashboard: 31 * FPS,
  cta: 38 * FPS,
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="TikTokProduct"
      component={TikTokProductVideo}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{}}
    />
  );
};

export const TikTokProductVideo = () => {
  return (
    <AbsoluteFill style={styles.stage}>
      <VoiceoverTracks />
      <AnimatedBackground />
      <Sequence from={sceneStarts.hook} durationInFrames={5 * FPS}>
        <HookScene />
      </Sequence>
      <Sequence from={sceneStarts.brand} durationInFrames={5 * FPS}>
        <BrandScene />
      </Sequence>
      <Sequence from={sceneStarts.feedback} durationInFrames={7 * FPS}>
        <FeedbackScene />
      </Sequence>
      <Sequence from={sceneStarts.rewrite} durationInFrames={7 * FPS}>
        <RewriteScene />
      </Sequence>
      <Sequence from={sceneStarts.exam} durationInFrames={7 * FPS}>
        <ExamScene />
      </Sequence>
      <Sequence from={sceneStarts.dashboard} durationInFrames={7 * FPS}>
        <DashboardScene />
      </Sequence>
      <Sequence from={sceneStarts.cta} durationInFrames={7 * FPS}>
        <CtaScene />
      </Sequence>
      <TopBrand />
      <ProgressBar />
    </AbsoluteFill>
  );
};

function VoiceoverTracks() {
  const tracks = [
    { from: sceneStarts.hook + 8, src: "voiceover/01-hook.mp3" },
    { from: sceneStarts.brand + 8, src: "voiceover/02-brand.mp3" },
    { from: sceneStarts.feedback + 8, src: "voiceover/03-feedback.mp3" },
    { from: sceneStarts.rewrite + 8, src: "voiceover/04-rewrite.mp3" },
    { from: sceneStarts.exam + 8, src: "voiceover/05-exam.mp3" },
    { from: sceneStarts.dashboard + 8, src: "voiceover/06-dashboard.mp3" },
    { from: sceneStarts.cta + 10, src: "voiceover/07-cta.mp3" },
  ];

  return (
    <>
      {tracks.map((track) => (
        <Sequence key={track.src} from={track.from} layout="none">
          <Audio src={staticFile(track.src)} volume={0.98} />
        </Sequence>
      ))}
    </>
  );
}

function HookScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <Kicker text="IELTS Writing" delay={0} />
      <Headline delay={8}>
        You got a Band score.
        <br />
        But what do you fix next?
      </Headline>
      <Subhead delay={26}>
        Most feedback stops at the number. Your next essay needs a plan.
      </Subhead>
      <div
        style={{
          ...styles.bandCard,
          opacity: appear(frame, 42),
          scale: scaleIn(frame, 42),
        }}
      >
        <div style={styles.miniLabel}>Overall Band</div>
        <div style={styles.bandValue}>6.5</div>
        <div style={styles.bandNote}>So close. Still unclear.</div>
      </div>
    </SceneShell>
  );
}

function BrandScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <div
        style={{
          ...styles.logoLockup,
          opacity: appear(frame, 3),
          scale: scaleIn(frame, 3),
        }}
      >
        <Img src={staticFile("icon.png")} style={styles.logo} />
        <div>
          <div style={styles.logoTitle}>AI IELTS Copilot</div>
          <div style={styles.logoSubtitle}>IELTS practice with AI feedback</div>
        </div>
      </div>
      <Headline delay={20}>
        Go beyond
        <br />
        the Band score.
      </Headline>
      <Subhead delay={42}>
        Get criterion scores, sentence rewrites, and clear next steps.
      </Subhead>
      <FeatureStack frame={frame} />
    </SceneShell>
  );
}

function FeedbackScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <Kicker text="AI Writing feedback" delay={0} />
      <Headline delay={8}>
        See exactly
        <br />
        what holds you back.
      </Headline>
      <div
        style={{
          ...styles.feedbackPanel,
          opacity: appear(frame, 32),
          translate: `0 ${interpolate(frame, [32, 52], [70, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}px`,
        }}
      >
        <div style={styles.feedbackHeader}>
          <div>
            <div style={styles.miniLabel}>Overall Band</div>
            <div style={styles.bigScore}>6.5</div>
          </div>
          <Pill text="Task 2" tone="dark" />
        </div>
        <ScoreRows frame={frame} />
      </div>
    </SceneShell>
  );
}

function RewriteScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <Kicker text="Original → Improved → Why" delay={0} />
      <Headline delay={8}>
        Turn vague feedback
        <br />
        into a better sentence.
      </Headline>
      <div style={styles.rewriteStack}>
        <RewriteBlock
          label="Original"
          text="Many people think work from home is good."
          color={colors.rose}
          delay={34}
          frame={frame}
        />
        <RewriteBlock
          label="Improved"
          text="Many people believe working from home is beneficial because it provides greater flexibility."
          color={colors.teal}
          delay={58}
          frame={frame}
        />
        <RewriteBlock
          label="Why"
          text="More natural phrasing, stronger vocabulary, clearer development."
          color={colors.blue}
          delay={82}
          frame={frame}
        />
      </div>
    </SceneShell>
  );
}

function ExamScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <Kicker text="Computer IELTS-style practice" delay={0} />
      <Headline delay={8}>
        Practice the test flow,
        <br />
        not just the questions.
      </Headline>
      <div
        style={{
          ...styles.examMock,
          opacity: appear(frame, 30),
          scale: scaleIn(frame, 30),
        }}
      >
        <div style={styles.examTop}>
          <Pill text="Reading Test" tone="dark" />
          <Pill text="36:42" tone="teal" />
          <Pill text="18/24 answered" tone="light" />
        </div>
        <div style={styles.examGrid}>
          <div style={styles.passagePane}>
            <div style={styles.paneTitle}>Passage</div>
            <ParagraphLines />
          </div>
          <div style={styles.answerPane}>
            <QuestionChip n="1" active />
            <QuestionChip n="2" />
            <QuestionChip n="3" flagged />
            <QuestionChip n="4" />
            <div style={styles.answerCard}>
              <div style={styles.questionLine}>Complete the sentence below.</div>
              <div style={styles.answerInput}>preventive infrastructure</div>
            </div>
          </div>
        </div>
      </div>
      <Subhead delay={96}>Reading, Listening, Writing, and Speaking prep in one workspace.</Subhead>
    </SceneShell>
  );
}

function DashboardScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell>
      <Kicker text="After practice" delay={0} />
      <Headline delay={8}>
        Track your progress.
        <br />
        Know the next move.
      </Headline>
      <div
        style={{
          ...styles.dashboardPanel,
          opacity: appear(frame, 34),
          translate: `0 ${interpolate(frame, [34, 58], [80, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}px`,
        }}
      >
        <div style={styles.dashboardCards}>
          <MetricCard label="Total Attempts" value="12" />
          <MetricCard label="Latest Practice" value="Writing" />
        </div>
        <div style={styles.chartCard}>
          <div style={styles.chartTitle}>Learning trend</div>
          <TrendLine frame={frame} />
        </div>
        <div style={styles.nextAction}>
          <Pill text="Recommended next" tone="teal" />
          <div style={styles.nextTitle}>Strengthen your Writing consistency</div>
        </div>
      </div>
    </SceneShell>
  );
}

function CtaScene() {
  const frame = useCurrentFrame();

  return (
    <SceneShell center>
      <div
        style={{
          ...styles.finalLogo,
          opacity: appear(frame, 0),
          scale: scaleIn(frame, 0),
        }}
      >
        <Img src={staticFile("icon.png")} style={styles.finalLogoImg} />
      </div>
      <Headline delay={14}>
        Try one AI Writing
        <br />
        feedback free today.
      </Headline>
      <Subhead delay={38}>
        AI IELTS Copilot helps you practise IELTS with feedback you can actually use.
      </Subhead>
      <div
        style={{
          ...styles.ctaButton,
          opacity: appear(frame, 70),
          scale: scaleIn(frame, 70),
        }}
      >
        aiieltscopilot.com
      </div>
      <div
        style={{
          ...styles.disclaimer,
          opacity: appear(frame, 92),
        }}
      >
        AI scores are for study guidance, not official IELTS results.
      </div>
    </SceneShell>
  );
}

function SceneShell({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) {
  return (
    <AbsoluteFill
      style={{
        ...styles.safeArea,
        justifyContent: center ? "center" : "flex-start",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

function TopBrand() {
  return (
    <div style={styles.topBrand}>
      <Img src={staticFile("icon.png")} style={styles.topBrandIcon} />
      <span>AI IELTS Copilot</span>
    </div>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, DURATION - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={styles.progressTrack}>
      <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
    </div>
  );
}

function AnimatedBackground() {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, DURATION], [0, 80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={styles.background}>
      <div
        style={{
          ...styles.grid,
          translate: `${-drift}px ${drift * 0.6}px`,
        }}
      />
      <div style={styles.cornerPanel} />
      <div
        style={{
          ...styles.accentRing,
          rotate: `${interpolate(frame, [0, DURATION], [-8, 8])}deg`,
        }}
      />
    </AbsoluteFill>
  );
}

function Kicker({ text, delay }: { text: string; delay: number }) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        ...styles.kicker,
        opacity: appear(frame, delay),
        translate: `0 ${interpolate(frame, [delay, delay + 18], [28, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
      }}
    >
      {text}
    </div>
  );
}

function Headline({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const frame = useCurrentFrame();

  return (
    <h1
      style={{
        ...styles.headline,
        opacity: appear(frame, delay),
        translate: `0 ${interpolate(frame, [delay, delay + 20], [48, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
      }}
    >
      {children}
    </h1>
  );
}

function Subhead({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const frame = useCurrentFrame();

  return (
    <p
      style={{
        ...styles.subhead,
        opacity: appear(frame, delay),
        translate: `0 ${interpolate(frame, [delay, delay + 18], [32, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
      }}
    >
      {children}
    </p>
  );
}

function FeatureStack({ frame }: { frame: number }) {
  const items = [
    "Task 1 and Task 2 specific feedback",
    "Criterion scores with clear reasons",
    "Sentence rewrites you can learn from",
  ];

  return (
    <div style={styles.featureStack}>
      {items.map((item, index) => (
        <div
          key={item}
          style={{
            ...styles.featureItem,
            opacity: appear(frame, 62 + index * 12),
            translate: `${interpolate(frame, [62 + index * 12, 82 + index * 12], [70, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            })}px 0`,
          }}
        >
          <span style={styles.checkDot}>✓</span>
          {item}
        </div>
      ))}
    </div>
  );
}

function ScoreRows({ frame }: { frame: number }) {
  const rows = [
    ["Task Response", "6.5", colors.teal],
    ["Coherence & Cohesion", "7.0", colors.blue],
    ["Lexical Resource", "6.5", colors.amber],
    ["Grammar Range & Accuracy", "6.5", colors.rose],
  ];

  return (
    <div style={styles.scoreRows}>
      {rows.map(([label, value, color], index) => (
        <div key={label} style={styles.scoreRow}>
          <div style={styles.scoreLabel}>{label}</div>
          <div style={styles.scoreTrack}>
            <div
              style={{
                ...styles.scoreFill,
                backgroundColor: color,
                width: `${interpolate(frame, [52 + index * 8, 82 + index * 8], [0, Number(value) * 12], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                })}%`,
              }}
            />
          </div>
          <div style={styles.scoreValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function RewriteBlock({
  label,
  text,
  color,
  delay,
  frame,
}: {
  label: string;
  text: string;
  color: string;
  delay: number;
  frame: number;
}) {
  return (
    <div
      style={{
        ...styles.rewriteBlock,
        borderColor: `${color}55`,
        opacity: appear(frame, delay),
        translate: `0 ${interpolate(frame, [delay, delay + 18], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}px`,
      }}
    >
      <div style={{ ...styles.rewriteLabel, color }}>{label}</div>
      <div style={styles.rewriteText}>{text}</div>
    </div>
  );
}

function Pill({
  text,
  tone,
}: {
  text: string;
  tone: "dark" | "teal" | "light";
}) {
  const background =
    tone === "dark" ? colors.ink : tone === "teal" ? colors.tealMist : colors.white;
  const color =
    tone === "dark" ? colors.white : tone === "teal" ? colors.teal : colors.slate;
  const border = tone === "dark" ? colors.ink : tone === "teal" ? "#99f6e4" : colors.line;

  return <div style={{ ...styles.pill, background, color, borderColor: border }}>{text}</div>;
}

function ParagraphLines() {
  return (
    <div style={styles.lines}>
      <div style={{ ...styles.line, width: "96%" }} />
      <div style={{ ...styles.line, width: "88%" }} />
      <div style={{ ...styles.line, width: "92%" }} />
      <div style={{ ...styles.highlightLine, width: "76%" }} />
      <div style={{ ...styles.line, width: "84%" }} />
      <div style={{ ...styles.line, width: "66%" }} />
    </div>
  );
}

function QuestionChip({
  n,
  active = false,
  flagged = false,
}: {
  n: string;
  active?: boolean;
  flagged?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.questionChip,
        background: active ? colors.ink : flagged ? "#fef3c7" : colors.white,
        color: active ? colors.white : flagged ? "#92400e" : colors.slate,
        borderColor: active ? colors.ink : flagged ? "#fcd34d" : colors.line,
      }}
    >
      {n}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
    </div>
  );
}

function TrendLine({ frame }: { frame: number }) {
  const width = interpolate(frame, [55, 95], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <div style={styles.trendWrap}>
      <div style={styles.chartGridLine} />
      <div style={{ ...styles.trendSegment, width: `${width}%` }} />
      <div style={{ ...styles.trendDot, left: `${Math.min(width, 96)}%` }} />
    </div>
  );
}

function appear(frame: number, start: number) {
  return interpolate(frame, [start, start + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

function scaleIn(frame: number, start: number) {
  return interpolate(frame, [start, start + 18], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

const styles: Record<string, React.CSSProperties> = {
  stage: {
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflow: "hidden",
  },
  background: {
    background:
      "linear-gradient(180deg, #fbfbf8 0%, #f8fafc 47%, #ecfeff 100%)",
  },
  grid: {
    position: "absolute",
    inset: -120,
    backgroundImage:
      "linear-gradient(to right, rgba(15, 23, 42, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px)",
    backgroundSize: "76px 76px",
  },
  cornerPanel: {
    position: "absolute",
    right: -170,
    top: 260,
    width: 520,
    height: 980,
    borderRadius: 36,
    background: "rgba(15, 118, 110, 0.08)",
    rotate: "8deg",
  },
  accentRing: {
    position: "absolute",
    left: -180,
    bottom: 220,
    width: 420,
    height: 420,
    borderRadius: "50%",
    border: "70px solid rgba(37, 99, 235, 0.08)",
  },
  safeArea: {
    padding: "188px 82px 132px",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 32,
  },
  topBrand: {
    position: "absolute",
    top: 72,
    left: 78,
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 30,
    fontWeight: 780,
    color: colors.ink,
  },
  topBrandIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
    background: "rgba(15, 23, 42, 0.08)",
  },
  progressFill: {
    height: "100%",
    background: colors.teal,
  },
  kicker: {
    alignSelf: "flex-start",
    border: `2px solid ${colors.line}`,
    background: "rgba(255, 255, 255, 0.88)",
    borderRadius: 999,
    padding: "14px 24px",
    fontSize: 34,
    fontWeight: 780,
    color: colors.teal,
    letterSpacing: 0,
  },
  headline: {
    margin: 0,
    fontSize: 88,
    lineHeight: 0.98,
    letterSpacing: 0,
    fontWeight: 860,
    color: colors.ink,
    maxWidth: 920,
  },
  subhead: {
    margin: 0,
    maxWidth: 820,
    fontSize: 43,
    lineHeight: 1.2,
    letterSpacing: 0,
    fontWeight: 550,
    color: colors.slate,
  },
  bandCard: {
    marginTop: 32,
    width: 470,
    borderRadius: 28,
    background: colors.ink,
    color: colors.white,
    padding: "34px 40px 36px",
    boxShadow: "0 36px 80px rgba(15, 23, 42, 0.28)",
  },
  miniLabel: {
    fontSize: 26,
    fontWeight: 680,
    color: "rgba(255,255,255,0.68)",
  },
  bandValue: {
    marginTop: 6,
    fontSize: 112,
    lineHeight: 1,
    fontWeight: 870,
  },
  bandNote: {
    marginTop: 16,
    fontSize: 31,
    lineHeight: 1.2,
    color: "rgba(255,255,255,0.75)",
  },
  logoLockup: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    marginTop: 20,
    borderRadius: 30,
    border: `2px solid ${colors.line}`,
    background: "rgba(255,255,255,0.82)",
    padding: 26,
    boxShadow: "0 24px 64px rgba(15,23,42,0.12)",
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  logoTitle: {
    fontSize: 42,
    fontWeight: 830,
    color: colors.ink,
  },
  logoSubtitle: {
    marginTop: 8,
    fontSize: 28,
    color: colors.slate,
  },
  featureStack: {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    borderRadius: 22,
    border: `2px solid ${colors.line}`,
    background: "rgba(255,255,255,0.88)",
    padding: "22px 24px",
    fontSize: 34,
    fontWeight: 680,
    color: colors.ink,
  },
  checkDot: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: colors.teal,
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
  },
  feedbackPanel: {
    marginTop: 18,
    borderRadius: 32,
    border: `2px solid ${colors.line}`,
    background: "rgba(255,255,255,0.92)",
    padding: 34,
    boxShadow: "0 30px 80px rgba(15,23,42,0.13)",
  },
  feedbackHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottom: `2px solid ${colors.line}`,
    paddingBottom: 26,
  },
  bigScore: {
    marginTop: 4,
    fontSize: 94,
    lineHeight: 1,
    fontWeight: 860,
    color: colors.ink,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid",
    borderRadius: 999,
    padding: "11px 18px",
    fontSize: 26,
    lineHeight: 1,
    fontWeight: 800,
  },
  scoreRows: {
    marginTop: 26,
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  scoreRow: {
    display: "grid",
    gridTemplateColumns: "270px 1fr 64px",
    alignItems: "center",
    gap: 16,
  },
  scoreLabel: {
    fontSize: 26,
    fontWeight: 700,
    color: colors.slate,
  },
  scoreTrack: {
    height: 22,
    borderRadius: 999,
    background: "#e2e8f0",
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    borderRadius: 999,
  },
  scoreValue: {
    fontSize: 30,
    fontWeight: 850,
    color: colors.ink,
    textAlign: "right",
  },
  rewriteStack: {
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  rewriteBlock: {
    borderRadius: 26,
    border: "2px solid",
    background: "rgba(255,255,255,0.92)",
    padding: "24px 28px",
    boxShadow: "0 22px 60px rgba(15,23,42,0.10)",
  },
  rewriteLabel: {
    fontSize: 28,
    fontWeight: 860,
  },
  rewriteText: {
    marginTop: 10,
    fontSize: 34,
    lineHeight: 1.22,
    fontWeight: 610,
    color: colors.ink,
  },
  examMock: {
    marginTop: 12,
    borderRadius: 30,
    background: colors.white,
    border: `2px solid ${colors.line}`,
    padding: 22,
    boxShadow: "0 30px 80px rgba(15,23,42,0.14)",
  },
  examTop: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    paddingBottom: 18,
    borderBottom: `2px solid ${colors.line}`,
  },
  examGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "1fr 0.82fr",
    gap: 18,
  },
  passagePane: {
    borderRadius: 20,
    background: "#f8fafc",
    padding: 22,
    minHeight: 410,
  },
  answerPane: {
    borderRadius: 20,
    background: "#f8fafc",
    padding: 18,
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: 12,
  },
  paneTitle: {
    fontSize: 28,
    fontWeight: 820,
    color: colors.ink,
    marginBottom: 24,
  },
  lines: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  line: {
    height: 18,
    borderRadius: 999,
    background: "#cbd5e1",
  },
  highlightLine: {
    height: 24,
    borderRadius: 999,
    background: "#fde68a",
  },
  questionChip: {
    width: 52,
    height: 52,
    borderRadius: 14,
    border: "2px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 25,
    fontWeight: 850,
  },
  answerCard: {
    flexBasis: "100%",
    marginTop: 8,
    borderRadius: 18,
    background: colors.white,
    border: `2px solid ${colors.line}`,
    padding: 18,
  },
  questionLine: {
    fontSize: 24,
    lineHeight: 1.25,
    color: colors.ink,
    fontWeight: 700,
  },
  answerInput: {
    marginTop: 14,
    borderRadius: 12,
    border: `2px solid ${colors.line}`,
    padding: "12px 14px",
    fontSize: 22,
    color: colors.teal,
    background: colors.tealMist,
    fontWeight: 760,
  },
  dashboardPanel: {
    marginTop: 10,
    borderRadius: 32,
    border: `2px solid ${colors.line}`,
    background: "rgba(255,255,255,0.92)",
    padding: 28,
    boxShadow: "0 30px 80px rgba(15,23,42,0.13)",
  },
  dashboardCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  metricCard: {
    borderRadius: 22,
    background: "#f8fafc",
    border: `2px solid ${colors.line}`,
    padding: 22,
  },
  metricLabel: {
    fontSize: 22,
    color: colors.muted,
    fontWeight: 680,
  },
  metricValue: {
    marginTop: 10,
    fontSize: 42,
    fontWeight: 860,
    color: colors.ink,
  },
  chartCard: {
    marginTop: 18,
    borderRadius: 22,
    border: `2px solid ${colors.line}`,
    background: colors.skySoft,
    padding: 22,
  },
  chartTitle: {
    fontSize: 28,
    fontWeight: 820,
    color: colors.ink,
  },
  trendWrap: {
    position: "relative",
    marginTop: 28,
    height: 180,
    borderRadius: 20,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.58))",
    overflow: "hidden",
  },
  chartGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    borderTop: "2px dashed rgba(37,99,235,0.25)",
  },
  trendSegment: {
    position: "absolute",
    left: 26,
    bottom: 44,
    height: 12,
    borderRadius: 999,
    background: colors.blue,
  },
  trendDot: {
    position: "absolute",
    bottom: 34,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: colors.blue,
    border: `6px solid ${colors.white}`,
  },
  nextAction: {
    marginTop: 18,
    borderRadius: 22,
    background: colors.tealMist,
    border: "2px solid #99f6e4",
    padding: 22,
  },
  nextTitle: {
    marginTop: 14,
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 820,
    color: colors.ink,
  },
  finalLogo: {
    alignSelf: "center",
    width: 150,
    height: 150,
    borderRadius: 36,
    background: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 32px 80px rgba(15,23,42,0.16)",
  },
  finalLogoImg: {
    width: 128,
    height: 128,
    borderRadius: 30,
  },
  ctaButton: {
    alignSelf: "center",
    marginTop: 18,
    borderRadius: 999,
    background: colors.ink,
    color: colors.white,
    padding: "24px 40px",
    fontSize: 38,
    fontWeight: 850,
    boxShadow: "0 24px 64px rgba(15,23,42,0.24)",
  },
  disclaimer: {
    marginTop: 20,
    alignSelf: "center",
    maxWidth: 760,
    textAlign: "center",
    fontSize: 25,
    lineHeight: 1.25,
    color: colors.muted,
  },
};
