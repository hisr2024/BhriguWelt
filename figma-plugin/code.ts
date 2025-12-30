export {};

type ColorStyles = Record<string, PaintStyle>;
type TextStyles = Record<string, TextStyle>;

type ScreenConfig = {
  name: string;
  summary: string;
  sections: { title: string; subtitle?: string }[];
};

const spacingScale = [4, 8, 12, 16, 20, 24, 32];
const screenConfigs: ScreenConfig[] = [
  {
    name: "Home",
    summary: "Greeting, epoch badge, primary insight, quick actions, consent strip.",
    sections: [
      { title: "Epoch Badge" },
      { title: "Primary Insight" },
      { title: "Quick Actions" },
      { title: "Consent & Preferences" }
    ]
  },
  {
    name: "Past Lives",
    summary: "Swipeable insight cards with sutra tags, filters, and save gesture cues.",
    sections: [
      { title: "Filters" },
      { title: "Insight Stack", subtitle: "Swipe to progress; long-press to save." },
      { title: "Consent Reminder" }
    ]
  },
  {
    name: "Future",
    summary: "Timeline with certainty opacity, focus card, consent before date specifics.",
    sections: [
      { title: "Timeline" },
      { title: "Focus Card" },
      { title: "Transits & Varshaphal" }
    ]
  },
  {
    name: "Karmic Dashboard",
    summary: "Bento grid for hotspots, gifts, assignments, and time filters.",
    sections: [
      { title: "Filters" },
      { title: "Bento Grid" },
      { title: "Assignments" }
    ]
  },
  {
    name: "Matchmaking",
    summary: "Dual profile header, harmony chips, comparison cards, and joint rituals.",
    sections: [
      { title: "Profiles" },
      { title: "Harmony Chips" },
      { title: "Comparison Cards" },
      { title: "Actions" }
    ]
  },
  {
    name: "Ask Bhrigu (Chat)",
    summary: "Full-height chat with quick prompts, inline references, and breathing indicator.",
    sections: [
      { title: "Quick Prompts" },
      { title: "Conversation" },
      { title: "Input Bar" }
    ]
  }
];

async function loadFonts() {
  const fonts: FontName[] = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
    { family: "Noto Serif", style: "Regular" },
    { family: "Noto Serif", style: "Bold" }
  ];
  await Promise.all(fonts.map((font) => figma.loadFontAsync(font)));
}

function hexToRgb(hex: string) {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function ensurePage(name: string): PageNode {
  const existing = figma.root.children.find((page) => page.name === name) as PageNode | undefined;
  const page = existing ?? figma.createPage();
  page.name = name;
  return page;
}

function clearPage(page: PageNode) {
  page.children.slice().forEach((child) => child.remove());
}

function createColorStyles(): ColorStyles {
  const palette = [
    { name: "Brand/Primary Indigo", hex: "#2E2A5A" },
    { name: "Brand/Accent Saffron", hex: "#F2B705" },
    { name: "Brand/Secondary Sage", hex: "#5F7D6E" },
    { name: "Surface/Layer", hex: "#111225" },
    { name: "Surface/Glow", hex: "#1B1D34" },
    { name: "Text/Primary", hex: "#EDEDED" },
    { name: "Text/Muted", hex: "#A8ADC2" },
    { name: "State/Positive", hex: "#6BBF8B" },
    { name: "State/Caution", hex: "#F2B705" },
    { name: "State/Neutral", hex: "#7A7A7A" },
    { name: "Border/Soft", hex: "#F2B705" }
  ];

  const styles: ColorStyles = {};
  palette.forEach((item) => {
    const existing = figma.getLocalPaintStyles().find((style) => style.name === item.name);
    const style = existing ?? figma.createPaintStyle();
    style.name = item.name;
    style.paints = [
      {
        type: "SOLID",
        color: hexToRgb(item.hex),
        opacity: item.name === "Border/Soft" ? 0.18 : 1
      }
    ];
    styles[item.name] = style;
  });
  return styles;
}

function createTextStyles(): TextStyles {
  const definitions = [
    {
      name: "Heading/XL",
      fontName: { family: "Inter", style: "Bold" } as FontName,
      fontSize: 28,
      lineHeight: 36
    },
    {
      name: "Heading/L",
      fontName: { family: "Inter", style: "Semi Bold" } as FontName,
      fontSize: 24,
      lineHeight: 32
    },
    {
      name: "Heading/M",
      fontName: { family: "Inter", style: "Semi Bold" } as FontName,
      fontSize: 20,
      lineHeight: 28
    },
    {
      name: "Body/Default",
      fontName: { family: "Inter", style: "Regular" } as FontName,
      fontSize: 17,
      lineHeight: 26
    },
    {
      name: "Body/Emphasis",
      fontName: { family: "Inter", style: "Medium" } as FontName,
      fontSize: 17,
      lineHeight: 26
    },
    {
      name: "Detail/Caption",
      fontName: { family: "Inter", style: "Medium" } as FontName,
      fontSize: 13,
      lineHeight: 18
    },
    {
      name: "Sutra/Serif",
      fontName: { family: "Noto Serif", style: "Bold" } as FontName,
      fontSize: 15,
      lineHeight: 22
    }
  ];

  const styles: TextStyles = {};
  definitions.forEach((def) => {
    const existing = figma.getLocalTextStyles().find((style) => style.name === def.name);
    const style = existing ?? figma.createTextStyle();
    style.name = def.name;
    style.fontName = def.fontName;
    style.fontSize = def.fontSize;
    style.lineHeight = { value: def.lineHeight, unit: "PIXELS" };
    styles[def.name] = style;
  });
  return styles;
}

function createText(label: string, textStyle: TextStyle, fillStyle?: PaintStyle) {
  const text = figma.createText();
  text.textStyleId = textStyle.id;
  if (fillStyle) {
    text.fillStyleId = fillStyle.id;
  }
  text.characters = label;
  return text;
}

function setAutoLayout(node: FrameNode | ComponentNode, direction: "HORIZONTAL" | "VERTICAL" = "VERTICAL") {
  node.layoutMode = direction;
  node.primaryAxisSizingMode = "AUTO";
  node.counterAxisSizingMode = "AUTO";
  node.itemSpacing = 12;
  node.paddingLeft = 16;
  node.paddingRight = 16;
  node.paddingTop = 16;
  node.paddingBottom = 16;
  node.cornerRadius = 16;
}

function createSection(parent: PageNode, title: string, textStyles: TextStyles, colors: ColorStyles) {
  const frame = figma.createFrame();
  setAutoLayout(frame, "VERTICAL");
  frame.name = title;
  frame.fills = [{ type: "SOLID", color: hexToRgb("#0E0F1A") }];
  frame.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.1 }];
  frame.effects = [
    {
      type: "DROP_SHADOW",
      color: { ...hexToRgb("#2E2A5A"), a: 0.2 },
      offset: { x: 0, y: 8 },
      radius: 20,
      visible: true,
      blendMode: "NORMAL"
    }
  ];
  const heading = createText(title, textStyles["Heading/M"], colors["Text/Primary"]);
  frame.appendChild(heading);
  parent.appendChild(frame);
  return frame;
}

function buildFoundations(page: PageNode, colors: ColorStyles, textStyles: TextStyles) {
  clearPage(page);

  const canvas = figma.createFrame();
  setAutoLayout(canvas, "VERTICAL");
  canvas.name = "Foundations";
  canvas.counterAxisAlignItems = "MIN";
  canvas.itemSpacing = 20;
  canvas.fills = [];
  page.appendChild(canvas);

  const colorSection = createSection(page, "Palette", textStyles, colors);
  colorSection.itemSpacing = 12;
  colorSection.paddingTop = 20;
  const colorGrid = figma.createFrame();
  setAutoLayout(colorGrid, "HORIZONTAL");
  colorGrid.itemSpacing = 16;
  colorGrid.name = "Color Tokens";
  colorGrid.fills = [];
  colorSection.appendChild(colorGrid);

  Object.entries(colors).forEach(([name, style]) => {
    const swatch = figma.createFrame();
    setAutoLayout(swatch, "VERTICAL");
    swatch.name = name;
    swatch.layoutAlign = "STRETCH";
    swatch.counterAxisAlignItems = "CENTER";
    swatch.resize(140, 140);
    swatch.fills = [{ type: "SOLID", color: (style.paints[0] as SolidPaint).color, opacity: style.paints[0].opacity ?? 1 }];
    swatch.strokes = [{ type: "SOLID", color: hexToRgb("#FFFFFF"), opacity: 0.08 }];
    const label = createText(name, textStyles["Detail/Caption"], colors["Text/Primary"]);
    swatch.appendChild(label);
    colorGrid.appendChild(swatch);
  });

  const typeSection = createSection(page, "Typography", textStyles, colors);
  const typeList = figma.createFrame();
  setAutoLayout(typeList, "VERTICAL");
  typeList.fills = [];
  typeSection.appendChild(typeList);

  const typeExamples = [
    { label: "Heading XL / Inter Bold", style: "Heading/XL" },
    { label: "Heading L / Inter Semi Bold", style: "Heading/L" },
    { label: "Body Default / Inter Regular", style: "Body/Default" },
    { label: "Body Emphasis / Inter Medium", style: "Body/Emphasis" },
    { label: "Caption / Inter Medium", style: "Detail/Caption" },
    { label: "Sutra Serif / Noto Serif Bold", style: "Sutra/Serif" }
  ];

  typeExamples.forEach((item) => {
    const row = figma.createFrame();
    setAutoLayout(row, "VERTICAL");
    row.fills = [];
    const text = createText(item.label, textStyles[item.style], colors["Text/Primary"]);
    row.appendChild(text);
    typeList.appendChild(row);
  });

  const spacingSection = createSection(page, "Spacing", textStyles, colors);
  spacingSection.itemSpacing = 8;
  const spacingRow = figma.createFrame();
  setAutoLayout(spacingRow, "HORIZONTAL");
  spacingRow.fills = [];
  spacingRow.itemSpacing = 12;
  spacingSection.appendChild(spacingRow);

  spacingScale.forEach((value) => {
    const token = figma.createFrame();
    setAutoLayout(token, "VERTICAL");
    token.fills = [{ type: "SOLID", color: hexToRgb("#2E2A5A"), opacity: 0.14 }];
    token.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.25 }];
    token.cornerRadius = 12;
    token.resize(Math.max(32, value * 3), 64);
    token.primaryAxisAlignItems = "CENTER";
    token.counterAxisAlignItems = "CENTER";
    const label = createText(`${value}px`, textStyles["Body/Emphasis"], colors["Text/Primary"]);
    token.appendChild(label);
    spacingRow.appendChild(token);
  });

  canvas.appendChild(colorSection);
  canvas.appendChild(typeSection);
  canvas.appendChild(spacingSection);
}

function createButtonComponent(name: string, colors: ColorStyles, textStyles: TextStyles, variant: "primary" | "secondary" | "ghost") {
  const component = figma.createComponent();
  setAutoLayout(component, "HORIZONTAL");
  component.name = name;
  component.itemSpacing = 8;
  component.counterAxisAlignItems = "CENTER";
  component.resize(200, 52);

  const label = createText("Action", textStyles["Body/Emphasis"], colors["Text/Primary"]);

  if (variant === "primary") {
    component.fillStyleId = colors["Brand/Primary Indigo"].id;
    component.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.25 }];
  } else if (variant === "secondary") {
    component.fills = [];
    component.strokes = [
      {
        type: "SOLID",
        color: hexToRgb("#2E2A5A"),
        opacity: 0.6
      }
    ];
    label.fillStyleId = colors["Text/Primary"].id;
  } else {
    component.fills = [{ type: "SOLID", color: hexToRgb("#2E2A5A"), opacity: 0.08 }];
    component.strokes = [];
    label.fillStyleId = colors["Text/Primary"].id;
  }

  component.appendChild(label);
  return component;
}

function createCardComponent(colors: ColorStyles, textStyles: TextStyles) {
  const card = figma.createComponent();
  setAutoLayout(card, "VERTICAL");
  card.name = "Card/Insight";
  card.itemSpacing = 8;
  card.paddingLeft = 20;
  card.paddingRight = 20;
  card.paddingTop = 20;
  card.paddingBottom = 20;
  card.resize(320, 200);
  card.fillStyleId = colors["Surface/Layer"].id;
  card.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.2 }];

  const badge = figma.createFrame();
  setAutoLayout(badge, "HORIZONTAL");
  badge.fills = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.14 }];
  badge.cornerRadius = 999;
  badge.itemSpacing = 6;
  badge.paddingLeft = 10;
  badge.paddingRight = 10;
  badge.paddingTop = 6;
  badge.paddingBottom = 6;
  const badgeText = createText("Epoch: Renewal", textStyles["Detail/Caption"], colors["Text/Primary"]);
  badge.appendChild(badgeText);

  const title = createText("Primary Insight", textStyles["Heading/M"], colors["Text/Primary"]);
  const subtitle = createText("Symbolic guidance with clear action.", textStyles["Body/Default"], colors["Text/Muted"]);

  const meter = figma.createFrame();
  setAutoLayout(meter, "VERTICAL");
  meter.fills = [];
  meter.itemSpacing = 6;
  meter.name = "Confidence";
  const meterLabel = createText("Confidence: Calmly Certain", textStyles["Detail/Caption"], colors["Text/Primary"]);
  const line = figma.createFrame();
  line.layoutMode = "HORIZONTAL";
  line.primaryAxisSizingMode = "FIXED";
  line.counterAxisSizingMode = "AUTO";
  line.resize(280, 6);
  line.cornerRadius = 999;
  line.fills = [{ type: "SOLID", color: hexToRgb("#6BBF8B") }];
  const pulse = figma.createEllipse();
  pulse.resize(14, 14);
  pulse.fills = [{ type: "SOLID", color: hexToRgb("#F2B705") }];
  pulse.strokes = [{ type: "SOLID", color: hexToRgb("#FFFFFF"), opacity: 0.2 }];
  pulse.x = 260;
  pulse.y = -4;
  line.appendChild(pulse);

  meter.appendChild(meterLabel);
  meter.appendChild(line);

  card.appendChild(badge);
  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(meter);

  return card;
}

function createIndicatorComponent(colors: ColorStyles, textStyles: TextStyles) {
  const indicator = figma.createComponent();
  setAutoLayout(indicator, "HORIZONTAL");
  indicator.name = "Indicator/Breathing";
  indicator.itemSpacing = 8;
  indicator.counterAxisAlignItems = "CENTER";
  indicator.fills = [{ type: "SOLID", color: hexToRgb("#2E2A5A"), opacity: 0.12 }];
  indicator.cornerRadius = 999;
  indicator.paddingLeft = 12;
  indicator.paddingRight = 12;
  indicator.paddingTop = 8;
  indicator.paddingBottom = 8;

  const dots = figma.createFrame();
  setAutoLayout(dots, "HORIZONTAL");
  dots.itemSpacing = 4;
  dots.fills = [];
  for (let i = 0; i < 3; i++) {
    const dot = figma.createEllipse();
    dot.resize(8, 8);
    dot.fills = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.7 - i * 0.15 }];
    dots.appendChild(dot);
  }

  const label = createText("Breathing", textStyles["Detail/Caption"], colors["Text/Primary"]);
  indicator.appendChild(dots);
  indicator.appendChild(label);
  return indicator;
}

function createNavComponent(colors: ColorStyles, textStyles: TextStyles) {
  const nav = figma.createComponent();
  setAutoLayout(nav, "HORIZONTAL");
  nav.name = "Nav/Bottom";
  nav.paddingLeft = 18;
  nav.paddingRight = 18;
  nav.paddingTop = 12;
  nav.paddingBottom = 12;
  nav.itemSpacing = 16;
  nav.counterAxisAlignItems = "CENTER";
  nav.fillStyleId = colors["Surface/Glow"].id;
  nav.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.2 }];
  nav.resize(360, 72);

  const destinations = ["Home", "Past", "Future", "Dashboard", "Chat"];
  destinations.forEach((dest, index) => {
    const item = figma.createFrame();
    setAutoLayout(item, "VERTICAL");
    item.counterAxisAlignItems = "CENTER";
    item.paddingLeft = 10;
    item.paddingRight = 10;
    item.paddingTop = 8;
    item.paddingBottom = 8;
    item.itemSpacing = 4;
    item.cornerRadius = 12;
    item.fills = [{ type: "SOLID", color: hexToRgb("#FFFFFF"), opacity: index === 0 ? 0.06 : 0 }];
    const icon = figma.createRectangle();
    icon.resize(20, 20);
    icon.cornerRadius = 6;
    icon.fills = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: index === 0 ? 1 : 0.32 }];
    const label = createText(dest, textStyles["Detail/Caption"], colors["Text/Primary"]);
    item.appendChild(icon);
    item.appendChild(label);
    nav.appendChild(item);
  });
  return nav;
}

function createCardGrid(colors: ColorStyles, textStyles: TextStyles) {
  const card = figma.createComponent();
  setAutoLayout(card, "VERTICAL");
  card.name = "Tile/Bento";
  card.itemSpacing = 6;
  card.paddingLeft = 16;
  card.paddingRight = 16;
  card.paddingTop = 16;
  card.paddingBottom = 16;
  card.resize(170, 140);
  card.fillStyleId = colors["Surface/Layer"].id;
  card.strokes = [{ type: "SOLID", color: hexToRgb("#FFFFFF"), opacity: 0.05 }];

  const eyebrow = createText("Hotspot", textStyles["Detail/Caption"], colors["State/Caution"]);
  const title = createText("Active Theme", textStyles["Heading/M"], colors["Text/Primary"]);
  const bullets = createText("Two lines for clear direction", textStyles["Body/Default"], colors["Text/Muted"]);
  const chip = figma.createFrame();
  setAutoLayout(chip, "HORIZONTAL");
  chip.paddingLeft = 10;
  chip.paddingRight = 10;
  chip.paddingTop = 6;
  chip.paddingBottom = 6;
  chip.cornerRadius = 999;
  chip.fills = [{ type: "SOLID", color: hexToRgb("#6BBF8B"), opacity: 0.14 }];
  const chipLabel = createText("In Motion", textStyles["Detail/Caption"], colors["Text/Primary"]);
  chip.appendChild(chipLabel);

  card.appendChild(eyebrow);
  card.appendChild(title);
  card.appendChild(bullets);
  card.appendChild(chip);
  return card;
}

function buildComponents(page: PageNode, colors: ColorStyles, textStyles: TextStyles) {
  clearPage(page);

  const canvas = figma.createFrame();
  setAutoLayout(canvas, "VERTICAL");
  canvas.name = "Components";
  canvas.itemSpacing = 20;
  canvas.fills = [];
  canvas.counterAxisAlignItems = "MIN";
  page.appendChild(canvas);

  const buttonRow = figma.createFrame();
  setAutoLayout(buttonRow, "HORIZONTAL");
  buttonRow.itemSpacing = 16;
  buttonRow.name = "Buttons";
  buttonRow.fills = [];
  const primaryButton = createButtonComponent("Button/Primary", colors, textStyles, "primary");
  const secondaryButton = createButtonComponent("Button/Secondary", colors, textStyles, "secondary");
  const ghostButton = createButtonComponent("Button/Ghost", colors, textStyles, "ghost");
  buttonRow.appendChild(primaryButton);
  buttonRow.appendChild(secondaryButton);
  buttonRow.appendChild(ghostButton);

  const card = createCardComponent(colors, textStyles);
  const indicator = createIndicatorComponent(colors, textStyles);
  const nav = createNavComponent(colors, textStyles);
  const tile = createCardGrid(colors, textStyles);

  canvas.appendChild(buttonRow);
  canvas.appendChild(card);
  canvas.appendChild(indicator);
  canvas.appendChild(nav);
  canvas.appendChild(tile);

  return { primaryButton, secondaryButton, ghostButton, card, indicator, nav, tile };
}

function createSectionRow(title: string, subtitle: string | undefined, textStyles: TextStyles, colors: ColorStyles) {
  const frame = figma.createFrame();
  setAutoLayout(frame, "VERTICAL");
  frame.itemSpacing = 6;
  frame.fills = [{ type: "SOLID", color: hexToRgb("#FFFFFF"), opacity: 0.02 }];
  frame.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.18 }];
  frame.paddingLeft = 14;
  frame.paddingRight = 14;
  frame.paddingTop = 14;
  frame.paddingBottom = 14;
  const titleNode = createText(title, textStyles["Heading/M"], colors["Text/Primary"]);
  frame.appendChild(titleNode);
  if (subtitle) {
    const subtitleNode = createText(subtitle, textStyles["Body/Default"], colors["Text/Muted"]);
    frame.appendChild(subtitleNode);
  }
  return frame;
}

function buildScreens(
  page: PageNode,
  colors: ColorStyles,
  textStyles: TextStyles,
  components: ReturnType<typeof buildComponents>
) {
  clearPage(page);
  const grid = figma.createFrame();
  setAutoLayout(grid, "HORIZONTAL");
  grid.itemSpacing = 32;
  grid.fills = [];
  grid.name = "Core Screens";
  grid.counterAxisAlignItems = "START";
  page.appendChild(grid);

  const screens: FrameNode[] = [];

  screenConfigs.forEach((config) => {
    const frame = figma.createFrame();
    frame.name = config.name;
    frame.resize(390, 844);
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisSizingMode = "FIXED";
    frame.counterAxisSizingMode = "FIXED";
    frame.itemSpacing = 14;
    frame.paddingLeft = 20;
    frame.paddingRight = 20;
    frame.paddingTop = 24;
    frame.paddingBottom = 24;
    frame.cornerRadius = 32;
    frame.fills = [
      {
        type: "GRADIENT_LINEAR",
        gradientStops: [
          { color: { ...hexToRgb("#0E0F1A"), a: 1 }, position: 0 },
          { color: { ...hexToRgb("#1B1D34"), a: 1 }, position: 1 }
        ],
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0]
        ]
      }
    ];
    frame.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.08 }];

    const header = figma.createFrame();
    setAutoLayout(header, "VERTICAL");
    header.itemSpacing = 4;
    header.fills = [];
    const title = createText(config.name, textStyles["Heading/L"], colors["Text/Primary"]);
    const subtitle = createText(config.summary, textStyles["Body/Default"], colors["Text/Muted"]);
    header.appendChild(title);
    header.appendChild(subtitle);

    const quickActions = figma.createFrame();
    setAutoLayout(quickActions, "HORIZONTAL");
    quickActions.itemSpacing = 12;
    quickActions.fills = [];
    quickActions.name = "Quick Actions";
    quickActions.appendChild(components.primaryButton.createInstance());
    quickActions.appendChild(components.secondaryButton.createInstance());

    const cardInstance = components.card.createInstance();
    const indicatorInstance = components.indicator.createInstance();
    const navInstance = components.nav.createInstance();

    frame.appendChild(header);
    frame.appendChild(cardInstance);

    config.sections.forEach((section) => {
      const sectionRow = createSectionRow(section.title, section.subtitle, textStyles, colors);
      frame.appendChild(sectionRow);
    });

    frame.appendChild(quickActions);
    frame.appendChild(indicatorInstance);
    frame.appendChild(navInstance);

    screens.push(frame);
    grid.appendChild(frame);
  });

  return screens;
}

function buildMotion(page: PageNode, colors: ColorStyles, textStyles: TextStyles, components: ReturnType<typeof buildComponents>) {
  clearPage(page);
  const canvas = figma.createFrame();
  setAutoLayout(canvas, "VERTICAL");
  canvas.itemSpacing = 20;
  canvas.name = "Motion & States";
  canvas.fills = [];
  page.appendChild(canvas);

  const motionRow = figma.createFrame();
  setAutoLayout(motionRow, "HORIZONTAL");
  motionRow.itemSpacing = 16;
  motionRow.fills = [];

  const enter = createSectionRow("Entrance: Fade + Slide", "120–200ms ease-in-out", textStyles, colors);
  const pulse = components.indicator.createInstance();
  enter.appendChild(pulse);

  const loading = createSectionRow("Loading: Breathing Dots", "Respect reduced motion", textStyles, colors);
  loading.appendChild(components.indicator.createInstance());

  const states = createSectionRow("States", "Default, Hover, Pressed, Disabled", textStyles, colors);
  const stateButtons = figma.createFrame();
  setAutoLayout(stateButtons, "HORIZONTAL");
  stateButtons.itemSpacing = 12;
  stateButtons.fills = [];

  const defaultButton = components.primaryButton.createInstance();
  const pressedButton = components.primaryButton.createInstance();
  pressedButton.opacity = 0.82;
  const disabledButton = components.primaryButton.createInstance();
  disabledButton.opacity = 0.4;

  stateButtons.appendChild(defaultButton);
  stateButtons.appendChild(pressedButton);
  stateButtons.appendChild(disabledButton);
  states.appendChild(stateButtons);

  motionRow.appendChild(enter);
  motionRow.appendChild(loading);
  motionRow.appendChild(states);

  canvas.appendChild(motionRow);
}

function buildFlows(page: PageNode, screens: FrameNode[], colors: ColorStyles, textStyles: TextStyles) {
  clearPage(page);
  const flowCanvas = figma.createFrame();
  setAutoLayout(flowCanvas, "VERTICAL");
  flowCanvas.name = "Flows";
  flowCanvas.itemSpacing = 16;
  flowCanvas.counterAxisAlignItems = "MIN";
  flowCanvas.fills = [];
  page.appendChild(flowCanvas);

  const flowRow = figma.createFrame();
  setAutoLayout(flowRow, "HORIZONTAL");
  flowRow.itemSpacing = 16;
  flowRow.fills = [];
  flowCanvas.appendChild(flowRow);

  screens.forEach((screen) => {
    const node = figma.createFrame();
    setAutoLayout(node, "VERTICAL");
    node.resize(220, 120);
    node.fills = [{ type: "SOLID", color: hexToRgb("#1B1D34"), opacity: 0.9 }];
    node.strokes = [{ type: "SOLID", color: hexToRgb("#F2B705"), opacity: 0.16 }];
    node.itemSpacing = 6;
    node.name = `${screen.name} – Flow`;
    const title = createText(screen.name, textStyles["Heading/M"], colors["Text/Primary"]);
    const summary = createText("Primary > deepen > consent > action", textStyles["Body/Default"], colors["Text/Muted"]);
    node.appendChild(title);
    node.appendChild(summary);

    node.flowStartingPoints = [
      {
        nodeId: node.id,
        name: `${screen.name} start`
      }
    ];

    flowRow.appendChild(node);
  });
}

async function main() {
  await loadFonts();
  const colors = createColorStyles();
  const textStyles = createTextStyles();

  const foundationsPage = ensurePage("🧬 Foundations");
  const componentsPage = ensurePage("🧱 Components");
  const mobilePage = ensurePage("📱 Mobile – Core Screens");
  const motionPage = ensurePage("✨ Motion & States");
  const flowsPage = ensurePage("🧠 Flows");

  buildFoundations(foundationsPage, colors, textStyles);
  const components = buildComponents(componentsPage, colors, textStyles);
  const screens = buildScreens(mobilePage, colors, textStyles, components);
  buildMotion(motionPage, colors, textStyles, components);
  buildFlows(flowsPage, screens, colors, textStyles);

  figma.currentPage = mobilePage;
  figma.notify("BhriguWelt design system generated.");
  figma.closePlugin();
}

main();
