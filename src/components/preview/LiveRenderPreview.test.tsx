// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LiveRenderPreview } from './LiveRenderPreview';

afterEach(cleanup);

describe('LiveRenderPreview', () => {
  it('renders a hidden iframe pointed at the mock frontend bootstrap route', () => {
    render(<LiveRenderPreview visible={false} onReadyChange={vi.fn()} />);
    const iframe = screen.getByTitle('Live theme preview') as HTMLIFrameElement;
    expect(iframe.src).toContain('/mock-frontend-bootstrap/index.html');
    expect(iframe.style.display).toBe('none');
  });

  it('shows the iframe when visible is true', () => {
    render(<LiveRenderPreview visible={true} onReadyChange={vi.fn()} />);
    const iframe = screen.getByTitle('Live theme preview') as HTMLIFrameElement;
    expect(iframe.style.display).not.toBe('none');
  });

  it('does NOT call onReadyChange on the iframe load event alone (load fires before hassConnection resolves, and on a plain 404 page)', () => {
    const onReadyChange = vi.fn();
    render(<LiveRenderPreview visible={false} onReadyChange={onReadyChange} />);
    const iframe = screen.getByTitle('Live theme preview');
    fireEvent.load(iframe);
    expect(onReadyChange).not.toHaveBeenCalled();
  });

  it('calls onReadyChange(true) when a hats:ready postMessage arrives from the iframe', () => {
    const onReadyChange = vi.fn();
    render(<LiveRenderPreview visible={false} onReadyChange={onReadyChange} />);
    const iframe = screen.getByTitle('Live theme preview') as HTMLIFrameElement;
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'hats:ready' }, source: iframe.contentWindow as any })
    );
    expect(onReadyChange).toHaveBeenCalledWith(true);
  });

  it('ignores a hats:ready message whose source is not this iframe', () => {
    const onReadyChange = vi.fn();
    render(<LiveRenderPreview visible={false} onReadyChange={onReadyChange} />);
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'hats:ready' }, source: window }));
    expect(onReadyChange).not.toHaveBeenCalled();
  });
});
