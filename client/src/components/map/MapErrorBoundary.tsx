import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("Map component error caught by boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="flex h-full min-h-[400px] w-full flex-col items-center justify-center border-dashed border-ink/20 bg-mist/60 p-6 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-ink text-sm">Interactive Map Unavailable</h3>
          <p className="mt-1 max-w-xs text-xs text-ink/60">
            {this.props.fallbackMessage ||
              "The map provider encountered a rendering error. Search and filter results remain fully accessible."}
          </p>
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={this.handleReset} className="text-xs">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reload Map
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
