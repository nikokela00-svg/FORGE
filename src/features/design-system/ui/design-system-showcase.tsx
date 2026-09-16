// Design-system showcase — a living reference of every shared UI primitive
"use client";

import { Check, MoreHorizontal, Plus, Settings, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Input,
  Kbd,
  Label,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-16 text-fg mt-10 font-semibold tracking-tight">{title}</h2>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border border-surface-2 border-b" aria-label={title}>
      <SectionHeader title={title} />
      <div className="flex flex-wrap items-start justify-start gap-4 py-6">
        {children}
      </div>
    </section>
  );
}

function TypographySection() {
  return (
    <section aria-label="Typography" className="flex flex-col gap-3 border-b py-6">
      <SectionHeader title="Typography" />
      <p className="text-32 text-fg font-semibold tracking-tight">Type ramp 32</p>
      <p className="text-24 text-fg font-medium">Type ramp 24</p>
      <p className="text-18 text-fg">Type ramp 18</p>
      <p className="text-16 text-fg">Type ramp 16</p>
      <p className="text-14 text-fg-muted">Type ramp 14 muted</p>
      <p className="text-12 text-fg-subtle">Type ramp 12 subtle</p>
    </section>
  );
}

function ButtonSection() {
  return (
    <Section title="Buttons">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
      <IconButton aria-label="Settings">
        <Settings />
      </IconButton>
    </Section>
  );
}

function FeedbackSection() {
  return (
    <Section title="Feedback">
      <Badge>Default</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
      <Spinner label="Loading" />
      <Skeleton className="h-4 w-24" />
      <Kbd>⌘K</Kbd>
      <Button variant="outline" onClick={() => toast.success("Workspace saved")}>
        Trigger toast
      </Button>
    </Section>
  );
}

function FormSection() {
  return (
    <Section title="Form controls">
      <div className="flex min-w-56 flex-col gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" placeholder="my-workspace" />
      </div>
      <div className="flex min-w-56 flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Context for the team…" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="share" />
        <Label htmlFor="share">Share with the workspace</Label>
      </div>
      <Select defaultValue="cloud">
        <SelectTrigger aria-label="Deployment target" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Targets</SelectLabel>
            <SelectItem value="cloud">Cloud</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="self-hosted">Self-hosted</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </Section>
  );
}

function OverlaySection() {
  return (
    <Section title="Overlays">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus />
            New workspace
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>Name the workspace to scaffold.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Workspace name" placeholder="forge-tools" />
          <DialogFooter>
            <Button variant="secondary">Cancel</Button>
            <Button>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton aria-label="Workspace actions">
            <MoreHorizontal />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Workspace</DropdownMenuLabel>
          <DropdownMenuItem>
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Trash2 />
            Delete workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton aria-label="Checkpoint">
              <Check />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Create checkpoint</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Section>
  );
}

function StructureSection() {
  return (
    <Section title="Structure">
      <Tabs defaultValue="files" className="w-80">
        <TabsList aria-label="View">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="files">
          File explorer pane with recent workspaces.
        </TabsContent>
        <TabsContent value="activity">Recent activity feed.</TabsContent>
        <TabsContent value="settings">Workspace settings pane.</TabsContent>
      </Tabs>
      <div className="flex w-48 flex-col gap-2">
        <ScrollArea className="border-border bg-surface-1 h-24 w-full rounded-md border">
          <div className="p-3">
            {Array.from({ length: 12 }, (_, index) => (
              <p key={String(index)} className="text-12 py-1">
                Log line {index + 1}
              </p>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <p className="text-12 text-fg-muted">Separator above</p>
      </div>
    </Section>
  );
}

export function DesignSystemShowcase() {
  return (
    <main className="bg-bg text-fg mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-8 py-12">
      <header>
        <h1 className="text-28 text-fg font-semibold tracking-tight">Design system</h1>
        <p className="text-14 text-fg-muted mt-1">
          Every primitive, styled by the FORGE token scale.
        </p>
      </header>
      <TypographySection />
      <ButtonSection />
      <FeedbackSection />
      <FormSection />
      <OverlaySection />
      <StructureSection />
      <Toaster />
    </main>
  );
}
