import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Switch,
  Text,
  Textarea,
  IconButton,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { ChevronDownIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Annotation, HighlightColor } from '@shared/types';
import type { ExtensionMessage, BackgroundResponse } from '@shared/messages';
import { encodeBase64UrlJson } from '@shared/base64url';
import { normalizePageUrl } from '@shared/url';
import { highlightAccent, highlightSoftBg } from './tokens';

const COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

async function send(msg: ExtensionMessage): Promise<BackgroundResponse> {
  return chrome.runtime.sendMessage(msg) as Promise<BackgroundResponse>;
}

function filterAnnotations(
  items: Annotation[],
  query: string,
  urlQ: string,
  color: HighlightColor | '',
  afterTs: number | null,
  beforeTs: number | null,
): Annotation[] {
  const q = query.trim().toLowerCase();
  const uq = urlQ.trim().toLowerCase();
  return items.filter((a) => {
    if (uq && !a.url.toLowerCase().includes(uq)) return false;
    if (color && a.color !== color) return false;
    if (afterTs !== null && a.createdAt < afterTs) return false;
    if (beforeTs !== null && a.createdAt > beforeTs + 86400000 - 1)
      return false;
    if (!q) return true;
    const hay =
      `${a.note}\n${a.selectedText}\n${a.title}\n${a.url}`.toLowerCase();
    return hay.includes(q);
  });
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function AppShell(props: { variant: 'popup' | 'sidepanel' }) {
  const toast = useToast();
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  const [items, setItems] = useState<Annotation[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [urlQ, setUrlQ] = useState('');
  const [color, setColor] = useState<HighlightColor | ''>('');
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const editModal = useDisclosure();
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [editNote, setEditNote] = useState('');

  const refresh = useCallback(async () => {
    const res = await send({ type: 'GET_ALL_ANNOTATIONS' });
    if (res.ok && 'annotations' in res && Array.isArray(res.annotations)) {
      setItems(res.annotations);
    }
  }, []);

  const refreshCurrentUrl = useCallback(async () => {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const tabUrl = tabs[0]?.url;
      setCurrentUrl(tabUrl ? normalizePageUrl(tabUrl) : '');
    } catch {
      setCurrentUrl('');
    }
  }, []);

  useEffect(() => {
    void refresh();
    void refreshCurrentUrl();
    const onChange = () => void refresh();
    chrome.storage.onChanged.addListener(onChange);
    const onFocus = () => void refreshCurrentUrl();
    window.addEventListener('focus', onFocus);
    const onTabActivated = () => {
      void refreshCurrentUrl();
      void refresh();
    };
    const onTabUpdated = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (!tab.active) return;
      if (changeInfo.status !== 'complete' && !changeInfo.url) return;
      void refreshCurrentUrl();
      void refresh();
    };
    chrome.tabs.onActivated.addListener(onTabActivated);
    chrome.tabs.onUpdated.addListener(onTabUpdated);
    return () => {
      chrome.storage.onChanged.removeListener(onChange);
      window.removeEventListener('focus', onFocus);
      chrome.tabs.onActivated.removeListener(onTabActivated);
      chrome.tabs.onUpdated.removeListener(onTabUpdated);
    };
  }, [refresh, refreshCurrentUrl]);

  useEffect(() => {
    void chrome.storage.local
      .get('notepro_color_mode')
      .then((res) => {
        const stored = res?.notepro_color_mode;
        if (stored === 'light' || stored === 'dark') setColorMode(stored);
      })
      .catch(() => undefined);
  }, [setColorMode]);

  const afterTs = afterDate ? new Date(afterDate).getTime() : null;
  const beforeTs = beforeDate ? new Date(beforeDate).getTime() : null;

  const urlScopedItems = useMemo(() => {
    if (showAllUrls || !currentUrl) return items;
    return items.filter((a) => a.url === currentUrl);
  }, [items, currentUrl, showAllUrls]);

  const filtered = useMemo(
    () =>
      filterAnnotations(urlScopedItems, query, urlQ, color, afterTs, beforeTs),
    [urlScopedItems, query, urlQ, color, afterTs, beforeTs],
  );

  const openSidePanel = async () => {
    try {
      const w = await chrome.windows.getCurrent();
      if (w.id != null) await chrome.sidePanel.open({ windowId: w.id });
    } catch {
      toast({ title: 'Could not open side panel', status: 'warning' });
    }
  };

  const scrollTo = async (id: string) => {
    const res = await send({ type: 'SCROLL_TO_ANNOTATION', id });
    if (!res.ok) toast({ title: res.error ?? 'Failed', status: 'error' });
  };

  const remove = async (id: string) => {
    await send({ type: 'DELETE_ANNOTATION', id });
    await refresh();
    toast({ title: 'Deleted', status: 'success' });
  };

  const copyShareLink = async (a: Annotation) => {
    const payload = {
      selectedText: a.selectedText,
      note: a.note,
      color: a.color,
      title: a.title,
      url: a.url,
      createdAt: a.createdAt,
    };
    const hash = encodeBase64UrlJson(payload);
    const href = chrome.runtime.getURL('share-viewer.html') + '#' + hash;
    await navigator.clipboard.writeText(href);
    toast({ title: 'Share link copied', status: 'success' });
  };

  const nativeShare = async (a: Annotation) => {
    const text = `${a.note ? `${a.note}\n\n` : ''}${a.selectedText}\n\n${a.url}`;
    const payload = {
      selectedText: a.selectedText,
      note: a.note,
      color: a.color,
      title: a.title,
      url: a.url,
      createdAt: a.createdAt,
    };
    const hash = encodeBase64UrlJson(payload);
    const shareUrl = chrome.runtime.getURL('share-viewer.html') + '#' + hash;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NotePro', text, url: shareUrl });
      } else {
        await copyShareLink(a);
      }
    } catch {
      /* user cancelled */
    }
  };

  const openEdit = (a: Annotation) => {
    setEditing(a);
    setEditNote(a.note);
    editModal.onOpen();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const next: Annotation = { ...editing, note: editNote };
    await send({ type: 'UPDATE_ANNOTATION', annotation: next });
    editModal.onClose();
    await refresh();
    toast({ title: 'Saved', status: 'success' });
  };

  const isPopup = props.variant === 'popup';
  const pad = isPopup ? 3 : 5;

  const emptyMessage =
    items.length === 0
      ? 'No highlights yet. Select text on any page and save from the floating toolbar.'
      : 'No annotations match your filters. Try clearing search or dates.';

  const handleToggleColorMode = () => {
    const nextMode = colorMode === 'dark' ? 'light' : 'dark';
    toggleColorMode();
    void chrome.storage.local.set({ notepro_color_mode: nextMode });
  };

  const subtleText = useColorModeValue('gray.600', 'gray.500');
  const uiBorder = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const labelText = useColorModeValue('gray.700', 'gray.300');
  const quoteBg = useColorModeValue('blackAlpha.50', 'blackAlpha.400');
  const quoteBorder = useColorModeValue('blackAlpha.100', 'whiteAlpha.100');
  const chipBg = useColorModeValue('blackAlpha.200', 'blackAlpha.400');
  const chipText = useColorModeValue('gray.700', 'gray.200');
  const chipBorder = useColorModeValue('blackAlpha.200', 'whiteAlpha.200');

  return (
    <Box
      p={pad}
      w="100%"
      minW={isPopup ? '420px' : undefined}
      maxW="100%"
      minH="100vh"
      bg="transparent"
      overflowY="auto"
    >
      <VStack align="stretch" spacing={4}>
        <Box pb={3} borderBottomWidth="1px" borderColor={uiBorder}>
          <HStack justify="space-between" align="flex-start" spacing={3}>
            <Box>
              <Heading
                as="h1"
                size="md"
                fontWeight="extrabold"
                letterSpacing="-0.02em"
                bgGradient="linear(to-r, indigo.300, purple.300)"
                bgClip="text"
              >
                NotePro
              </Heading>
              <Text fontSize="xs" color={subtleText} mt={1} lineHeight="short">
                Highlights & notes from the web
              </Text>
            </Box>
            <HStack spacing={2}>
              <IconButton
                size="sm"
                variant="surface"
                aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
                icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
                onClick={handleToggleColorMode}
              />
              {props.variant === 'popup' ? (
                <Button
                  size="sm"
                  variant="surface"
                  onClick={() => void openSidePanel()}
                >
                  Side panel
                </Button>
              ) : null}
            </HStack>
          </HStack>
        </Box>

        <Card>
          <CardBody py={3} px={4}>
            <HStack justify="space-between">
              <FormLabel
                fontSize="sm"
                fontWeight="semibold"
                color={labelText}
                mb={0}
              >
                Show all URLs
              </FormLabel>
              <Switch
                colorScheme="purple"
                isChecked={showAllUrls}
                onChange={(e) => setShowAllUrls(e.target.checked)}
              />
            </HStack>
            <Text fontSize="xs" color={subtleText} mt={1}>
              {showAllUrls
                ? 'Displaying annotations from all pages.'
                : currentUrl
                  ? `Showing current page only: ${hostFromUrl(currentUrl)}`
                  : 'Current page URL unavailable, showing all pages.'}
            </Text>
          </CardBody>
        </Card>

        <Button
          size="sm"
          variant="surface"
          alignSelf="flex-start"
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? 'Hide filters' : 'Show filters'}
        </Button>

        {showFilters ? (
          <Card>
            <CardHeader py={3} px={4}>
              <Text fontSize="sm" fontWeight="semibold" color={labelText}>
                Filters
              </Text>
            </CardHeader>
            <CardBody pt={0} px={4} pb={4}>
              <VStack align="stretch" spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" color={subtleText} mb={1}>
                    Search
                  </FormLabel>
                  <Input
                    placeholder="Notes, quotes, titles…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="xs" color={subtleText} mb={1}>
                    Page URL contains
                  </FormLabel>
                  <Input
                    placeholder="e.g. wikipedia.org"
                    value={urlQ}
                    onChange={(e) => setUrlQ(e.target.value)}
                  />
                </FormControl>
                <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="xs" color={subtleText} mb={1}>
                      Color
                    </FormLabel>
                    <Select
                      placeholder="Any"
                      value={color}
                      onChange={(e) =>
                        setColor(e.target.value as HighlightColor | '')
                      }
                    >
                      <option value="">Any color</option>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color={subtleText} mb={1}>
                      From
                    </FormLabel>
                    <Input
                      type="date"
                      value={afterDate}
                      onChange={(e) => setAfterDate(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" color={subtleText} mb={1}>
                      To
                    </FormLabel>
                    <Input
                      type="date"
                      value={beforeDate}
                      onChange={(e) => setBeforeDate(e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        ) : null}

        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Badge
            colorScheme="purple"
            variant="subtle"
            px={3}
            py={1}
            fontSize="xs"
          >
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </Badge>
          <Text fontSize="xs" color={subtleText}>
            {items.length} saved total
          </Text>
        </HStack>

        {filtered.length === 0 ? (
          <Card>
            <CardBody py={10} px={6} textAlign="center">
              <Text fontSize="sm" color={subtleText} maxW="280px" mx="auto">
                {emptyMessage}
              </Text>
            </CardBody>
          </Card>
        ) : (
          <VStack align="stretch" spacing={3}>
            {filtered.map((a) => (
              <Card
                key={a.id}
                overflow="hidden"
                borderLeftWidth="4px"
                borderLeftColor={highlightAccent[a.color]}
                bg={highlightSoftBg[a.color]}
              >
                <CardBody p={4}>
                  <HStack
                    justify="space-between"
                    align="flex-start"
                    mb={2}
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Badge
                      bg={chipBg}
                      color={chipText}
                      borderWidth="1px"
                      borderColor={chipBorder}
                      textTransform="capitalize"
                    >
                      {a.color}
                    </Badge>
                    <Text fontSize="xs" color={subtleText}>
                      {new Date(a.createdAt).toLocaleString()}
                    </Text>
                  </HStack>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="notepro.highlightTitle"
                    noOfLines={2}
                    mb={1}
                  >
                    {a.title || 'Untitled page'}
                  </Text>
                  <Text fontSize="xs" color="notepro.link" mb={3} noOfLines={1}>
                    {hostFromUrl(a.url)}
                  </Text>
                  <Box
                    borderRadius="md"
                    px={3}
                    py={2}
                    mb={3}
                    bg={quoteBg}
                    borderWidth="1px"
                    borderColor={quoteBorder}
                  >
                    <Text
                      fontSize="sm"
                      fontStyle="italic"
                      color="notepro.highlightQuote"
                      noOfLines={6}
                    >
                      “{a.selectedText}”
                    </Text>
                  </Box>
                  {a.note ? (
                    <Text
                      fontSize="sm"
                      mb={3}
                      whiteSpace="pre-wrap"
                      color="notepro.highlightNote"
                    >
                      {a.note}
                    </Text>
                  ) : null}
                  <Divider borderColor={uiBorder} mb={3} />
                  <ButtonGroup
                    size="sm"
                    variant="outline"
                    spacing={2}
                    flexWrap="wrap"
                  >
                    <Button variant="surface" onClick={() => void scrollTo(a.id)}>
                      Scroll to
                    </Button>
                    <Button variant="surface" onClick={() => openEdit(a)}>
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="red"
                      onClick={() => void remove(a.id)}
                    >
                      Delete
                    </Button>
                    <Menu>
                      <MenuButton
                        as={Button}
                        variant="surface"
                        rightIcon={<ChevronDownIcon />}
                      >
                        Share
                      </MenuButton>
                      <MenuList
                        bg="notepro.raised"
                        borderColor="notepro.border"
                        boxShadow="noteproElevated"
                        fontSize="sm"
                      >
                        <MenuItem
                          bg="notepro.raised"
                          _hover={{ bg: 'notepro.surface' }}
                          onClick={() => void copyShareLink(a)}
                        >
                          Copy link
                        </MenuItem>
                        <MenuItem
                          bg="notepro.raised"
                          _hover={{ bg: 'notepro.surface' }}
                          onClick={() => void nativeShare(a)}
                        >
                          Share…
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </ButtonGroup>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>

      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={3} bg="notepro.surface">
          <ModalHeader>Edit note</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={6}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editModal.onClose}>
              Cancel
            </Button>
            <Button variant="brand" onClick={() => void saveEdit()}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
