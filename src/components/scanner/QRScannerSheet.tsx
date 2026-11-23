import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '@/components/Toast';
import { haptic } from '@/lib/haptics';
import { getDisplayUrl, isWebUrl } from '@/lib/url';
import { fonts, softShadow } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { PressableScale } from '../PressableScale';

type QRContentType = 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'blocked';

type ParsedQR = {
  raw: string;
  type: QRContentType;
  title: string;
  subtitle: string;
  isHttpWarning?: boolean;
  canOpenInBrowser: boolean;
  blockedReason?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
  onSearchText?: (query: string) => void;
};

const SCREEN = Dimensions.get('window');
const SCAN_FRAME_SIZE = Math.min(SCREEN.width * 0.72, 280);

const DANGEROUS_SCHEMES = /^(?:javascript|file|intent|data|content|blob|about):/i;

function parseQRContent(data: string): ParsedQR {
  const trimmed = data.trim();

  // 1. Security Check: Reject dangerous schemes
  if (DANGEROUS_SCHEMES.test(trimmed)) {
    return {
      raw: trimmed,
      type: 'blocked',
      title: 'Blocked Dangerous Link',
      subtitle: `Scheme "${trimmed.split(':')[0]}:" is blocked by Nexus security policy for your protection.`,
      canOpenInBrowser: false,
      blockedReason: 'Potentially malicious or local URI scheme',
    };
  }

  // 2. Web URL check
  if (isWebUrl(trimmed)) {
    const isHttp = /^http:\/\//i.test(trimmed);
    const display = getDisplayUrl(trimmed);
    return {
      raw: trimmed,
      type: 'url',
      title: display.host,
      subtitle: display.path || 'Website Link',
      isHttpWarning: isHttp,
      canOpenInBrowser: true,
    };
  }

  // 3. Wi-Fi QR check
  if (/^WIFI:/i.test(trimmed)) {
    const ssidMatch = trimmed.match(/S:([^;]+)/i);
    const ssid = ssidMatch ? ssidMatch[1] : 'Network';
    return {
      raw: trimmed,
      type: 'wifi',
      title: `Wi-Fi: ${ssid}`,
      subtitle: 'Wi-Fi network setup credentials',
      canOpenInBrowser: false,
    };
  }

  // 4. Mailto check
  if (/^mailto:/i.test(trimmed)) {
    const email = trimmed.replace(/^mailto:/i, '').split('?')[0];
    return {
      raw: trimmed,
      type: 'email',
      title: email,
      subtitle: 'Email address',
      canOpenInBrowser: false,
    };
  }

  // 5. Phone check
  if (/^tel:/i.test(trimmed)) {
    const phone = trimmed.replace(/^tel:/i, '');
    return {
      raw: trimmed,
      type: 'phone',
      title: phone,
      subtitle: 'Telephone number',
      canOpenInBrowser: false,
    };
  }

  // 6. Generic plain text
  return {
    raw: trimmed,
    type: 'text',
    title: trimmed.length > 40 ? `${trimmed.slice(0, 39)}…` : trimmed,
    subtitle: `${trimmed.length} characters of plain text`,
    canOpenInBrowser: false,
  };
}

export function QRScannerSheet({
  visible,
  onClose,
  onOpenUrl,
  onSearchText,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scannedResult, setScannedResult] = useState<ParsedQR | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Manage camera lifecycle
  useEffect(() => {
    if (visible) {
      setScannedResult(null);
      setTorch(false);
      setIsCameraActive(true);

      if (!permission?.granted) {
        requestPermission();
      }
    } else {
      setIsCameraActive(false);
      setTorch(false);
    }
  }, [visible, permission?.granted, requestPermission]);

  // Turn off camera when app is backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        setIsCameraActive(false);
      } else if (visible && !scannedResult) {
        setIsCameraActive(true);
      }
    });
    return () => sub.remove();
  }, [visible, scannedResult]);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (!data || scannedResult) return;
      haptic.success();
      const parsed = parseQRContent(data);
      setScannedResult(parsed);
      setIsCameraActive(false);
    },
    [scannedResult],
  );

  const handleCopy = async () => {
    if (!scannedResult) return;
    haptic.tap();
    await Clipboard.setStringAsync(scannedResult.raw);
    toast.show('Copied to clipboard');
  };

  const handleOpenLink = () => {
    if (!scannedResult || !scannedResult.canOpenInBrowser) return;
    haptic.tap();
    const url = scannedResult.raw;
    onClose();
    onOpenUrl(url);
  };

  const handleSearchText = () => {
    if (!scannedResult || !scannedResult.raw) return;
    haptic.tap();
    const query = scannedResult.raw;
    onClose();
    if (onSearchText) {
      onSearchText(query);
    } else {
      onOpenUrl(query);
    }
  };

  const handleScanAgain = () => {
    haptic.tap();
    setScannedResult(null);
    setIsCameraActive(true);
  };

  const handleOpenSettings = async () => {
    haptic.tap();
    try {
      await Linking.openSettings();
    } catch {}
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: '#000000' }]}>
        {/* Permission Denied Fallback */}
        {permission && !permission.granted ? (
          <View style={[styles.permissionContainer, { paddingTop: insets.top + 20 }]}>
            <View style={styles.topBar}>
              <IconButton
                icon="close"
                label="Close scanner"
                size={38}
                iconSize={18}
                color="#FFFFFF"
                onPress={onClose}
              />
            </View>

            <View style={styles.permissionBody}>
              <View style={[styles.permissionOrb, { backgroundColor: 'rgba(255, 90, 43, 0.15)' }]}>
                <Icon name="qr" size={32} color={theme.accent} strokeWidth={2} />
              </View>
              <Text style={styles.permissionTitle}>Camera Permission Required</Text>
              <Text style={styles.permissionText}>
                Nexus needs camera access to scan QR codes and open links. Your camera stream is analyzed on-device to detect QR codes and is never recorded or uploaded by Nexus.
              </Text>
              <PressableScale
                onPress={handleOpenSettings}
                scaleTo={0.96}
                style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                accessibilityLabel="Open settings to allow camera"
              >
                <Text style={[styles.primaryBtnText, { color: theme.accentInk }]}>
                  Open Settings
                </Text>
              </PressableScale>
            </View>
          </View>
        ) : (
          /* Live Camera View */
          <View style={StyleSheet.absoluteFill}>
            {isCameraActive ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={scannedResult ? undefined : handleBarcodeScanned}
              />
            ) : null}

            {/* Viewfinder Overlay with Dark Mask */}
            <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
              {/* Header Controls */}
              <View style={styles.topControls}>
                <View style={styles.controlCircle}>
                  <IconButton
                    icon="close"
                    label="Close QR scanner"
                    size={42}
                    iconSize={18}
                    color="#FFFFFF"
                    onPress={onClose}
                  />
                </View>
                <View style={styles.controlCircle}>
                  <IconButton
                    icon="sparkle"
                    label={torch ? 'Turn off light' : 'Turn on light'}
                    size={42}
                    iconSize={18}
                    color={torch ? theme.accent : '#FFFFFF'}
                    onPress={() => {
                      haptic.tap();
                      setTorch((prev) => !prev);
                    }}
                  />
                </View>
              </View>

              {/* Viewfinder Target Box */}
              {!scannedResult ? (
                <View style={styles.viewfinderContainer}>
                  <View style={styles.scanFrame}>
                    {/* Corner Reticles */}
                    <View style={[styles.corner, styles.cornerTL, { borderColor: theme.accent }]} />
                    <View style={[styles.corner, styles.cornerTR, { borderColor: theme.accent }]} />
                    <View style={[styles.corner, styles.cornerBL, { borderColor: theme.accent }]} />
                    <View style={[styles.corner, styles.cornerBR, { borderColor: theme.accent }]} />
                  </View>
                  <Text style={styles.instructionsText}>
                    Align QR code within the frame to scan
                  </Text>
                </View>
              ) : null}

              {/* Scanned Result Card */}
              {scannedResult ? (
                <View
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.line,
                    },
                    softShadow(theme.mode, 'dock'),
                  ]}
                >
                  <View style={styles.resultHeader}>
                    <View style={[styles.resultTypeBadge, { backgroundColor: theme.accentSoft }]}>
                      <Icon
                        name={
                          scannedResult.type === 'url'
                            ? 'globe'
                            : scannedResult.type === 'blocked'
                              ? 'shield'
                              : 'copy'
                        }
                        size={12}
                        color={theme.accent}
                        strokeWidth={2}
                      />
                      <Text style={[styles.resultTypeLabel, { color: theme.accent }]}>
                        {scannedResult.type.toUpperCase()}
                      </Text>
                    </View>

                    {scannedResult.isHttpWarning ? (
                      <View style={[styles.warningBadge, { backgroundColor: 'rgba(217, 83, 79, 0.15)' }]}>
                        <Text style={styles.warningText}>⚠️ Insecure HTTP</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text numberOfLines={1} style={[styles.resultTitle, { color: theme.ink }]}>
                    {scannedResult.title}
                  </Text>
                  <Text numberOfLines={2} style={[styles.resultSubtitle, { color: theme.muted }]}>
                    {scannedResult.subtitle}
                  </Text>

                  {/* Actions */}
                  <View style={styles.actionRow}>
                    <PressableScale
                      onPress={handleCopy}
                      scaleTo={0.96}
                      style={[styles.actionBtn, { borderColor: theme.line }]}
                      accessibilityLabel="Copy scanned text to clipboard"
                    >
                      <Icon name="copy" size={14} color={theme.ink} strokeWidth={2} />
                      <Text style={[styles.actionBtnText, { color: theme.ink }]}>Copy</Text>
                    </PressableScale>

                    {scannedResult.canOpenInBrowser ? (
                      <PressableScale
                        onPress={handleOpenLink}
                        scaleTo={0.96}
                        style={[styles.primaryActionBtn, { backgroundColor: theme.accent }]}
                        accessibilityLabel="Open URL in Nexus Browser"
                      >
                        <Text style={[styles.primaryActionBtnText, { color: theme.accentInk }]}>
                          Open in Browser
                        </Text>
                        <Icon name="arrowRight" size={15} color={theme.accentInk} strokeWidth={2.2} />
                      </PressableScale>
                    ) : scannedResult.type === 'text' && onSearchText ? (
                      <PressableScale
                        onPress={handleSearchText}
                        scaleTo={0.96}
                        style={[styles.primaryActionBtn, { backgroundColor: theme.accent }]}
                        accessibilityLabel="Search scanned text with Nexus"
                      >
                        <Text style={[styles.primaryActionBtnText, { color: theme.accentInk }]}>
                          Search Web
                        </Text>
                        <Icon name="search" size={15} color={theme.accentInk} strokeWidth={2.2} />
                      </PressableScale>
                    ) : (
                      <PressableScale
                        onPress={handleScanAgain}
                        scaleTo={0.96}
                        style={[styles.primaryActionBtn, { backgroundColor: theme.chip }]}
                        accessibilityLabel="Scan another QR code"
                      >
                        <Text style={[styles.primaryActionBtnText, { color: theme.ink }]}>
                          Scan Again
                        </Text>
                      </PressableScale>
                    )}
                  </View>

                  {scannedResult.canOpenInBrowser ? (
                    <PressableScale
                      onPress={handleScanAgain}
                      style={styles.scanAgainLink}
                      accessibilityLabel="Scan another code"
                    >
                      <Text style={[styles.scanAgainLinkText, { color: theme.muted }]}>
                        Scan another code
                      </Text>
                    </PressableScale>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#0F0E0C',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  permissionBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  permissionOrb: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#A0988A',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    height: 48,
    paddingHorizontal: 26,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  controlCircle: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 21,
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    position: 'relative',
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderWidth: 3.5,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },
  instructionsText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 22,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  resultCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultTypeBadge: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultTypeLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  warningBadge: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#D9534F',
  },
  resultTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    marginBottom: 3,
  },
  resultSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  primaryActionBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  scanAgainLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  scanAgainLinkText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
