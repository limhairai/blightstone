import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function StyleGuidePage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">AdHub Style Guide</h1>
        <p className="text-muted-foreground">A comprehensive guide to AdHub's design system</p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Primary and secondary colors used throughout the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-[#b4a0ff]"></div>
                  <div>
                    <p className="font-medium">Primary</p>
                    <p className="text-sm text-muted-foreground">#b4a0ff</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-[#ffb4a0]"></div>
                  <div>
                    <p className="font-medium">Secondary</p>
                    <p className="text-sm text-muted-foreground">#ffb4a0</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-20 rounded-md bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]"></div>
                <div>
                  <p className="font-medium">Primary Gradient</p>
                  <p className="text-sm text-muted-foreground">from-[#b4a0ff] to-[#ffb4a0]</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-[#0A0A0A] border border-[#2A2A2A]"></div>
                  <div>
                    <p className="font-medium">Background</p>
                    <p className="text-sm text-muted-foreground">#0A0A0A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-[#1A1A1A] border border-[#2A2A2A]"></div>
                  <div>
                    <p className="font-medium">Card Background</p>
                    <p className="text-sm text-muted-foreground">#1A1A1A</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-md bg-[#0A0A0A] border-2 border-[#2A2A2A]"></div>
                  <div>
                    <p className="font-medium">Border</p>
                    <p className="text-sm text-muted-foreground">#2A2A2A</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-12 rounded-md bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="text-green-500">Success</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 rounded-md bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                    <span className="text-yellow-500">Warning</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <span className="text-red-500">Error</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-blue-500">Info</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Font styles used throughout the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h1 className="text-5xl font-bold">Heading 1</h1>
                  <p className="text-sm text-muted-foreground mt-1">text-5xl font-bold</p>
                </div>
                <div>
                  <h2 className="text-4xl font-bold">Heading 2</h2>
                  <p className="text-sm text-muted-foreground mt-1">text-4xl font-bold</p>
                </div>
                <div>
                  <h3 className="text-3xl font-bold">Heading 3</h3>
                  <p className="text-sm text-muted-foreground mt-1">text-3xl font-bold</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold">Heading 4</h4>
                  <p className="text-sm text-muted-foreground mt-1">text-2xl font-bold</p>
                </div>
                <div>
                  <h5 className="text-xl font-bold">Heading 5</h5>
                  <p className="text-sm text-muted-foreground mt-1">text-xl font-bold</p>
                </div>
                <div>
                  <h6 className="text-lg font-bold">Heading 6</h6>
                  <p className="text-sm text-muted-foreground mt-1">text-lg font-bold</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="text-base">Body text (base)</p>
                  <p className="text-sm text-muted-foreground mt-1">text-base</p>
                </div>
                <div>
                  <p className="text-sm">Small text</p>
                  <p className="text-sm text-muted-foreground mt-1">text-sm</p>
                </div>
                <div>
                  <p className="text-xs">Extra small text</p>
                  <p className="text-sm text-muted-foreground mt-1">text-xs</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <p className="font-normal">Normal weight</p>
                  <p className="text-sm text-muted-foreground mt-1">font-normal</p>
                </div>
                <div>
                  <p className="font-medium">Medium weight</p>
                  <p className="text-sm text-muted-foreground mt-1">font-medium</p>
                </div>
                <div>
                  <p className="font-semibold">Semibold weight</p>
                  <p className="text-sm text-muted-foreground mt-1">font-semibold</p>
                </div>
                <div>
                  <p className="font-bold">Bold weight</p>
                  <p className="text-sm text-muted-foreground mt-1">font-bold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>Button styles and variants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline" className="border-[#2A2A2A] hover:bg-[#2A2A2A]">
                  Outline
                </Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Elements</CardTitle>
              <CardDescription>Input fields, labels, and form controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="example-input">Input Field</Label>
                  <Input id="example-input" placeholder="Enter text..." className="bg-[#0A0A0A] border-[#2A2A2A]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled Input</Label>
                  <Input
                    id="disabled-input"
                    placeholder="Disabled input"
                    disabled
                    className="bg-[#0A0A0A] border-[#2A2A2A]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Badges</CardTitle>
              <CardDescription>Status indicators for various states</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>
                <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejected</Badge>
                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Processing</Badge>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactive</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Card components for content organization</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle>Standard Card</CardTitle>
                  <CardDescription>Basic card with header and content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the content area of the card.</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
                <CardHeader>
                  <CardTitle>Card with Footer</CardTitle>
                  <CardDescription>Card with actions in the footer</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This card includes a footer with actions.</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-[#2A2A2A] pt-4">
                  <Button variant="ghost" className="hover:bg-[#2A2A2A]">
                    Cancel
                  </Button>
                  <Button className="bg-[#b4a0ff] hover:bg-[#9f84ca] text-black">Save</Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spacing Tab */}
        <TabsContent value="spacing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spacing Scale</CardTitle>
              <CardDescription>Consistent spacing values used throughout the application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[1, 2, 3, 4, 6, 8, 12, 16].map((size) => (
                  <div key={size} className="flex items-center gap-4">
                    <div className={`h-8 bg-[#b4a0ff] w-${size}`}></div>
                    <div>
                      <p className="font-medium">Spacing {size}</p>
                      <p className="text-sm text-muted-foreground">
                        {size * 0.25}rem ({size * 4}px)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
