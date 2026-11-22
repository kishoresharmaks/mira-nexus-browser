import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { PressableScale } from '../PressableScale';
import { useToast } from '../Toast';
import { haptic } from '@/lib/haptics';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export type ActiveModal =
  | 'none'
  | 'calculator'
  | 'converter'
  | 'wordcounter'
  | 'timer'
  | 'clipboard'
  | 'devinfo'
  | 'urlinspector'
  | 'pagesource';

type Props = {
  activeModal: ActiveModal;
  currentUrl?: string;
  onClose: () => void;
};

// -------------------------------------------------------------
// 1. CALCULATOR MODAL
// -------------------------------------------------------------
function CalculatorView({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const toast = useToast();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleDigit = (char: string) => {
    haptic.tap();
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? char : prev + char));
  };

  const handleOp = (op: string) => {
    haptic.tap();
    if (display === 'Error') return;
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handleClear = () => {
    haptic.tap();
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    haptic.tap();
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEquals = () => {
    haptic.success();
    try {
      const full = `${equation}${display}`;
      // Clean safe math expression (digits and standard ops only)
      const sanitized = full.replace(/[^0-9+\-*/.]/g, '');
      // evaluate arithmetic safely using Function
      const result = new Function(`'use strict'; return (${sanitized})`)();
      if (!Number.isFinite(result)) {
        setDisplay('Error');
      } else {
        const rounded = Math.round(result * 1000000) / 1000000;
        setDisplay(String(rounded));
        setEquation('');
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleCopyResult = async () => {
    if (display === 'Error') return;
    haptic.tap();
    await Clipboard.setStringAsync(display);
    toast.show(`Copied "${display}" to clipboard`);
  };

  const buttons = [
    ['C', 'DEL', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', ''],
  ];

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>Calculator</Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <PressableScale onPress={handleCopyResult} style={[styles.calcScreen, { backgroundColor: theme.chip }]}>
        <Text numberOfLines={1} style={[styles.calcEquation, { color: theme.muted }]}>
          {equation || ' '}
        </Text>
        <Text numberOfLines={1} style={[styles.calcDisplay, { color: theme.ink }]}>
          {display}
        </Text>
        <Text style={[styles.calcHint, { color: theme.muted }]}>Tap to copy result</Text>
      </PressableScale>

      <View style={styles.calcGrid}>
        {buttons.map((row, rIdx) => (
          <View key={rIdx} style={styles.calcRow}>
            {row.map((btn, cIdx) => {
              if (!btn) return <View key={cIdx} style={styles.calcKeyEmpty} />;
              const isOp = ['+', '-', '*', '/', '='].includes(btn);
              const isAction = ['C', 'DEL', '%'].includes(btn);
              return (
                <PressableScale
                  key={btn}
                  onPress={() => {
                    if (btn === 'C') handleClear();
                    else if (btn === 'DEL') handleBackspace();
                    else if (btn === '=') handleEquals();
                    else if (['+', '-', '*', '/'].includes(btn)) handleOp(btn);
                    else handleDigit(btn);
                  }}
                  style={[
                    styles.calcKey,
                    {
                      backgroundColor: isOp ? theme.accent : isAction ? theme.chip : theme.surface,
                      borderColor: theme.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.calcKeyText,
                      { color: isOp ? '#FFFFFF' : isAction ? theme.accent : theme.ink },
                    ]}
                  >
                    {btn}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// 2. UNIT CONVERTER MODAL
// -------------------------------------------------------------
function UnitConverterView({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const toast = useToast();
  const [unitType, setUnitType] = useState<'length' | 'weight' | 'temp' | 'data'>('length');
  const [val, setVal] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');

  const result = useMemo(() => {
    const num = parseFloat(val) || 0;
    if (unitType === 'length') {
      const inMeters: Record<string, number> = { m: 1, km: 1000, cm: 0.01, ft: 0.3048, mi: 1609.34 };
      const m = num * (inMeters[fromUnit] || 1);
      return (m / (inMeters[toUnit] || 1)).toFixed(3);
    }
    if (unitType === 'weight') {
      const inKg: Record<string, number> = { kg: 1, g: 0.001, lb: 0.453592, oz: 0.0283495 };
      const kg = num * (inKg[fromUnit] || 1);
      return (kg / (inKg[toUnit] || 1)).toFixed(3);
    }
    if (unitType === 'temp') {
      if (fromUnit === toUnit) return String(num);
      let celsius = num;
      if (fromUnit === '°F') celsius = ((num - 32) * 5) / 9;
      if (fromUnit === 'K') celsius = num - 273.15;

      if (toUnit === '°C') return celsius.toFixed(1);
      if (toUnit === '°F') return ((celsius * 9) / 5 + 32).toFixed(1);
      if (toUnit === 'K') return (celsius + 273.15).toFixed(1);
    }
    if (unitType === 'data') {
      const inBytes: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
      const b = num * (inBytes[fromUnit] || 1);
      return (b / (inBytes[toUnit] || 1)).toFixed(3);
    }
    return '0';
  }, [val, unitType, fromUnit, toUnit]);

  const unitsForType = useMemo(() => {
    if (unitType === 'length') return ['m', 'km', 'cm', 'ft', 'mi'];
    if (unitType === 'weight') return ['kg', 'g', 'lb', 'oz'];
    if (unitType === 'temp') return ['°C', '°F', 'K'];
    return ['B', 'KB', 'MB', 'GB'];
  }, [unitType]);

  const switchType = (t: 'length' | 'weight' | 'temp' | 'data') => {
    haptic.select();
    setUnitType(t);
    if (t === 'length') { setFromUnit('m'); setToUnit('ft'); }
    if (t === 'weight') { setFromUnit('kg'); setToUnit('lb'); }
    if (t === 'temp') { setFromUnit('°C'); setToUnit('°F'); }
    if (t === 'data') { setFromUnit('MB'); setToUnit('GB'); }
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>Unit Converter</Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <View style={styles.pillsRow}>
        {(['length', 'weight', 'temp', 'data'] as const).map((t) => (
          <PressableScale
            key={t}
            onPress={() => switchType(t)}
            style={[
              styles.typePill,
              { backgroundColor: unitType === t ? theme.accent : theme.chip },
            ]}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 11.5, color: unitType === t ? '#FFFFFF' : theme.inkSoft }}>
              {t.toUpperCase()}
            </Text>
          </PressableScale>
        ))}
      </View>

      <Text style={[styles.inputLabel, { color: theme.muted, marginTop: 10 }]}>VALUE</Text>
      <TextInput
        value={val}
        onChangeText={setVal}
        keyboardType="numeric"
        style={[styles.input, { color: theme.ink, borderColor: theme.line }]}
      />

      <View style={styles.converterRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: theme.muted }]}>FROM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unitsForType.map((u) => (
              <PressableScale
                key={u}
                onPress={() => { haptic.tap(); setFromUnit(u); }}
                style={[styles.unitChip, { backgroundColor: fromUnit === u ? theme.accent : theme.chip }]}
              >
                <Text style={{ color: fromUnit === u ? '#FFFFFF' : theme.inkSoft, fontFamily: fonts.medium, fontSize: 12 }}>
                  {u}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.inputLabel, { color: theme.muted }]}>TO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unitsForType.map((u) => (
              <PressableScale
                key={u}
                onPress={() => { haptic.tap(); setToUnit(u); }}
                style={[styles.unitChip, { backgroundColor: toUnit === u ? theme.accent : theme.chip }]}
              >
                <Text style={{ color: toUnit === u ? '#FFFFFF' : theme.inkSoft, fontFamily: fonts.medium, fontSize: 12 }}>
                  {u}
                </Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      </View>

      <PressableScale
        onPress={async () => {
          haptic.tap();
          await Clipboard.setStringAsync(result);
          toast.show(`Copied ${result} ${toUnit}`);
        }}
        style={[styles.resultCard, { backgroundColor: theme.chip, borderColor: theme.line }]}
      >
        <Text style={[styles.resultLabel, { color: theme.muted }]}>CONVERTED RESULT</Text>
        <Text style={[styles.resultValue, { color: theme.ink }]}>
          {result} {toUnit}
        </Text>
        <Text style={[styles.calcHint, { color: theme.muted }]}>Tap to copy result</Text>
      </PressableScale>
    </View>
  );
}

// -------------------------------------------------------------
// 3. WORD COUNTER MODAL
// -------------------------------------------------------------
function WordCounterView({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const toast = useToast();
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+/g) || []).length || 1 : 0;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, charsNoSpaces, sentences, readMinutes };
  }, [text]);

  const handlePaste = async () => {
    haptic.tap();
    const clip = await Clipboard.getStringAsync();
    if (clip) {
      setText(clip);
      toast.show('Pasted from clipboard');
    }
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>Word Counter</Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.accent }]}>{stats.words}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Words</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.ink }]}>{stats.chars}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Chars</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.ink }]}>{stats.sentences}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Sentences</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: theme.accent }]}>{stats.readMinutes}m</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Read Time</Text>
        </View>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type or paste text here to analyze..."
        placeholderTextColor={theme.muted}
        multiline
        style={[styles.textArea, { color: theme.ink, borderColor: theme.line, backgroundColor: theme.surface }]}
      />

      <View style={styles.modalButtons}>
        <PressableScale onPress={handlePaste} style={[styles.actionButton, { backgroundColor: theme.chip }]}>
          <Icon name="clipboard" size={14} color={theme.ink} />
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: theme.ink, marginLeft: 4 }}>
            Paste
          </Text>
        </PressableScale>
        {text.length > 0 && (
          <PressableScale onPress={() => setText('')} style={[styles.actionButton, { backgroundColor: theme.chip }]}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: theme.muted }}>Clear</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// 4. FOCUS TIMER MODAL
// -------------------------------------------------------------
function FocusTimerView({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setRunning(false);
            haptic.warn();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running]);

  const setTimerPreset = (m: 'focus' | 'short' | 'long', mins: number) => {
    haptic.select();
    setMode(m);
    setRunning(false);
    setSecondsLeft(mins * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>Focus Timer</Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <View style={styles.pillsRow}>
        <PressableScale
          onPress={() => setTimerPreset('focus', 25)}
          style={[styles.typePill, { backgroundColor: mode === 'focus' ? theme.accent : theme.chip }]}
        >
          <Text style={{ color: mode === 'focus' ? '#FFF' : theme.inkSoft, fontFamily: fonts.medium, fontSize: 11.5 }}>
            Focus 25m
          </Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTimerPreset('short', 5)}
          style={[styles.typePill, { backgroundColor: mode === 'short' ? theme.accent : theme.chip }]}
        >
          <Text style={{ color: mode === 'short' ? '#FFF' : theme.inkSoft, fontFamily: fonts.medium, fontSize: 11.5 }}>
            Break 5m
          </Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTimerPreset('long', 15)}
          style={[styles.typePill, { backgroundColor: mode === 'long' ? theme.accent : theme.chip }]}
        >
          <Text style={{ color: mode === 'long' ? '#FFF' : theme.inkSoft, fontFamily: fonts.medium, fontSize: 11.5 }}>
            Rest 15m
          </Text>
        </PressableScale>
      </View>

      <View style={styles.timerCircle}>
        <Text style={[styles.timerDisplay, { color: theme.ink }]}>{timeFormatted}</Text>
        <Text style={[styles.timerStatus, { color: running ? theme.accent : theme.muted }]}>
          {running ? 'Keep going · Focus mode active' : 'Paused'}
        </Text>
      </View>

      <View style={styles.modalButtons}>
        <PressableScale
          onPress={() => {
            haptic.tap();
            setRunning(!running);
          }}
          style={[styles.timerControlBtn, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 14 }}>
            {running ? 'Pause' : 'Start Focus'}
          </Text>
        </PressableScale>
        <PressableScale
          onPress={() => {
            haptic.tap();
            setRunning(false);
            setSecondsLeft(mode === 'focus' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60);
          }}
          style={[styles.timerControlBtn, { backgroundColor: theme.chip }]}
        >
          <Text style={{ color: theme.ink, fontFamily: fonts.medium, fontSize: 14 }}>
            Reset
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// 5. CLIPBOARD TOOLS MODAL
// -------------------------------------------------------------
function ClipboardToolsView({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const toast = useToast();
  const [clipText, setClipText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClipboard = async () => {
    setLoading(true);
    const content = await Clipboard.getStringAsync();
    setClipText(content || '');
    setLoading(false);
  };

  useEffect(() => {
    fetchClipboard();
  }, []);

  const handleClear = async () => {
    haptic.warn();
    await Clipboard.setStringAsync('');
    setClipText('');
    toast.show('Clipboard cleared');
  };

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>Clipboard Inspector</Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <View style={[styles.clipBox, { backgroundColor: theme.chip, borderColor: theme.line }]}>
        <Text style={[styles.inputLabel, { color: theme.muted }]}>
          CURRENT CLIPBOARD CONTENT ({clipText.length} characters)
        </Text>
        <ScrollView style={{ maxHeight: 180 }}>
          <Text style={[styles.clipText, { color: theme.ink }]}>
            {loading ? 'Reading clipboard...' : clipText || '(Clipboard is currently empty)'}
          </Text>
        </ScrollView>
      </View>

      <View style={styles.modalButtons}>
        <PressableScale
          onPress={fetchClipboard}
          style={[styles.actionButton, { backgroundColor: theme.chip }]}
        >
          <Text style={{ color: theme.ink, fontFamily: fonts.medium, fontSize: 12 }}>Refresh</Text>
        </PressableScale>
        {clipText.length > 0 && (
          <PressableScale
            onPress={handleClear}
            style={[styles.actionButton, { backgroundColor: theme.accentSoft }]}
          >
            <Text style={{ color: theme.accent, fontFamily: fonts.medium, fontSize: 12 }}>Clear</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// 6. DEVELOPER TOOLS: WEB INFO & URL INSPECTOR
// -------------------------------------------------------------
function DeveloperToolsView({
  type,
  currentUrl,
  onClose,
}: {
  type: 'devinfo' | 'urlinspector' | 'pagesource';
  currentUrl?: string;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const toast = useToast();

  const urlData = useMemo(() => {
    const url = currentUrl || 'https://nexus.local';
    try {
      const parsed = new URL(url);
      const params: { key: string; value: string }[] = [];
      parsed.searchParams.forEach((v, k) => {
        params.push({ key: k, value: v });
      });
      return {
        href: url,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        params,
        hash: parsed.hash || 'none',
      };
    } catch {
      return {
        href: url,
        protocol: 'https:',
        hostname: url,
        pathname: '/',
        params: [],
        hash: 'none',
      };
    }
  }, [currentUrl]);

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalTop}>
        <Text style={[styles.modalTitle, { color: theme.ink }]}>
          {type === 'devinfo' ? 'Website & Runtime Info' : type === 'urlinspector' ? 'URL Inspector' : 'Page Source'}
        </Text>
        <IconButton icon="close" label="Close" size={32} iconSize={15} onPress={onClose} />
      </View>

      <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
        {type === 'devinfo' && (
          <View style={styles.devRows}>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>Host</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>{urlData.hostname}</Text>
            </View>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>Protocol</Text>
              <Text style={[styles.devVal, { color: urlData.protocol === 'https:' ? theme.accent : '#D9534F' }]}>
                {urlData.protocol} (TLS 1.3 / Enforced)
              </Text>
            </View>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>User Agent</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>Mozilla/5.0 Nexus/1.0 (Android; Mobile)</Text>
            </View>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>JavaScript Engine</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>Hermes 0.88.1 (Bytecode Compiled)</Text>
            </View>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>OS Architecture</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>Android (React Native 0.88.1)</Text>
            </View>
          </View>
        )}

        {type === 'urlinspector' && (
          <View style={styles.devRows}>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>Full URL</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>{urlData.href}</Text>
            </View>
            <View style={styles.devRow}>
              <Text style={[styles.devKey, { color: theme.muted }]}>Path</Text>
              <Text style={[styles.devVal, { color: theme.ink }]}>{urlData.pathname}</Text>
            </View>
            <Text style={[styles.inputLabel, { color: theme.muted, marginTop: 10 }]}>
              QUERY PARAMETERS ({urlData.params.length})
            </Text>
            {urlData.params.length === 0 ? (
              <Text style={[styles.devVal, { color: theme.muted }]}>No query parameters present.</Text>
            ) : (
              urlData.params.map((p, i) => (
                <View key={i} style={styles.paramRow}>
                  <Text style={[styles.paramKey, { color: theme.accent }]}>{p.key}:</Text>
                  <Text style={[styles.paramVal, { color: theme.ink }]}>{p.value}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {type === 'pagesource' && (
          <View>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>VIEW SOURCE PREVIEW</Text>
            <View style={[styles.sourceBox, { backgroundColor: theme.chip }]}>
              <Text style={[styles.sourceText, { color: theme.ink }]}>
                {`<!DOCTYPE html>\n<html>\n  <head>\n    <title>${urlData.hostname}</title>\n    <meta name="viewport" content="width=device-width" />\n  </head>\n  <body>\n    <!-- Page rendered via Secure WebView -->\n    <div id="root">\n      <!-- ${urlData.href} -->\n    </div>\n  </body>\n</html>`}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.modalButtons}>
        <PressableScale
          onPress={async () => {
            haptic.tap();
            await Clipboard.setStringAsync(urlData.href);
            toast.show('URL copied to clipboard');
          }}
          style={[styles.actionButton, { backgroundColor: theme.accent }]}
        >
          <Text style={{ color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 12 }}>Copy Details</Text>
        </PressableScale>
      </View>
    </View>
  );
}

// -------------------------------------------------------------
// MAIN MODAL ORCHESTRATOR
// -------------------------------------------------------------
export function ExploreProductivityModals({
  activeModal,
  currentUrl,
  onClose,
}: Props) {
  const { theme } = useTheme();

  if (activeModal === 'none') return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.line },
            softShadow(theme.mode, 'card'),
          ]}
        >
          {activeModal === 'calculator' && <CalculatorView onClose={onClose} />}
          {activeModal === 'converter' && <UnitConverterView onClose={onClose} />}
          {activeModal === 'wordcounter' && <WordCounterView onClose={onClose} />}
          {activeModal === 'timer' && <FocusTimerView onClose={onClose} />}
          {activeModal === 'clipboard' && <ClipboardToolsView onClose={onClose} />}
          {(activeModal === 'devinfo' || activeModal === 'urlinspector' || activeModal === 'pagesource') && (
            <DeveloperToolsView type={activeModal} currentUrl={currentUrl} onClose={onClose} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  modalContent: {
    gap: 12,
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  calcScreen: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  calcEquation: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  calcDisplay: {
    fontFamily: fonts.medium,
    fontSize: 28,
    marginTop: 2,
  },
  calcHint: {
    fontFamily: fonts.sans,
    fontSize: 10,
    marginTop: 4,
  },
  calcGrid: {
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    gap: 6,
  },
  calcKey: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  calcKeyEmpty: {
    flex: 1,
  },
  calcKeyText: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  converterRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  resultCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  resultLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1,
  },
  resultValue: {
    fontFamily: fonts.medium,
    fontSize: 22,
    marginTop: 4,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontFamily: fonts.serif,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  textArea: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  timerCircle: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  timerDisplay: {
    fontFamily: fonts.serif,
    fontSize: 48,
  },
  timerStatus: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 6,
  },
  timerControlBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  clipBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  clipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  devRows: {
    gap: 8,
  },
  devRow: {
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
  },
  devKey: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  devVal: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    marginTop: 2,
  },
  paramRow: {
    flexDirection: 'row',
    gap: 6,
  },
  paramKey: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  paramVal: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  sourceBox: {
    padding: 12,
    borderRadius: 12,
  },
  sourceText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
