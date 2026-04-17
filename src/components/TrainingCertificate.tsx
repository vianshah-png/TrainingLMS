"use client";

import { useRef, useCallback } from "react";
import { Download, Award, Share2 } from "lucide-react";

interface TrainingCertificateProps {
    userName: string;
    completionDate: string;
    certificateId: string;
    onDownload?: () => void;
}

export default function TrainingCertificate({ userName, completionDate, certificateId, onDownload }: TrainingCertificateProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const generateCertificate = useCallback(async (): Promise<HTMLCanvasElement | null> => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // High-res canvas
        const W = 1600;
        const H = 1100;
        canvas.width = W;
        canvas.height = H;

        // ─── Background ───────────────────────────────────────────
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#FAFCEE');
        bgGrad.addColorStop(0.5, '#FFFFFF');
        bgGrad.addColorStop(1, '#F0F7F7');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ─── Decorative border ────────────────────────────────────
        ctx.strokeStyle = '#0E5858';
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, W - 80, H - 80);
        ctx.strokeStyle = '#00B6C1';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, W - 100, H - 100);

        // ─── Corner flourishes ────────────────────────────────────
        const drawCorner = (x: number, y: number, flipX: number, flipY: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(flipX, flipY);
            ctx.strokeStyle = '#00B6C1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(60, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 60);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 0.5);
            ctx.strokeStyle = '#0E5858';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        };
        drawCorner(70, 70, 1, 1);
        drawCorner(W - 70, 70, -1, 1);
        drawCorner(70, H - 70, 1, -1);
        drawCorner(W - 70, H - 70, -1, -1);

        // ─── Award Icon ──────────────────────────────────────────
        const iconGrad = ctx.createRadialGradient(W / 2, 190, 10, W / 2, 190, 50);
        iconGrad.addColorStop(0, '#FFCC00');
        iconGrad.addColorStop(1, '#F5A623');
        ctx.fillStyle = iconGrad;
        ctx.beginPath();
        ctx.arc(W / 2, 190, 40, 0, Math.PI * 2);
        ctx.fill();

        // Star in circle
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', W / 2, 192);

        // ─── Header ──────────────────────────────────────────────
        ctx.fillStyle = '#00B6C1';
        ctx.font = '600 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '8px';
        ctx.fillText('B A L A N C E   N U T R I T I O N', W / 2, 270);

        ctx.fillStyle = '#0E5858';
        ctx.font = '300 52px Georgia, serif';
        ctx.fillText('Certificate of Completion', W / 2, 340);

        // ─── Decorative line ─────────────────────────────────────
        const lineGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(0.2, '#00B6C1');
        lineGrad.addColorStop(0.5, '#0E5858');
        lineGrad.addColorStop(0.8, '#00B6C1');
        lineGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 250, 380);
        ctx.lineTo(W / 2 + 250, 380);
        ctx.stroke();

        // ─── "This certifies that" ──────────────────────────────
        ctx.fillStyle = '#666666';
        ctx.font = '300 20px Georgia, serif';
        ctx.fillText('This is to certify that', W / 2, 430);

        // ─── User Name ───────────────────────────────────────────
        ctx.fillStyle = '#0E5858';
        ctx.font = 'bold 56px Georgia, serif';
        ctx.fillText(userName || 'Counsellor', W / 2, 510);

        // Name underline
        const nameWidth = ctx.measureText(userName || 'Counsellor').width;
        ctx.strokeStyle = '#00B6C1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2 - nameWidth / 2, 535);
        ctx.lineTo(W / 2 + nameWidth / 2, 535);
        ctx.stroke();

        // ─── Body Text ───────────────────────────────────────────
        ctx.fillStyle = '#555555';
        ctx.font = '300 20px Georgia, serif';
        ctx.fillText('has successfully completed the', W / 2, 590);

        ctx.fillStyle = '#0E5858';
        ctx.font = 'bold 26px Georgia, serif';
        ctx.fillText('BN Counsellor Training Program', W / 2, 640);

        ctx.fillStyle = '#666666';
        ctx.font = '300 18px Georgia, serif';
        ctx.fillText('achieving proficiency in nutrition counselling, sales methodology,', W / 2, 690);
        ctx.fillText('and Balance Nutrition operational protocols.', W / 2, 720);

        // ─── Date & Certificate ID ───────────────────────────────
        ctx.fillStyle = '#0E5858';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Date of Completion', 180, 830);
        ctx.fillStyle = '#333333';
        ctx.font = '300 18px Georgia, serif';
        ctx.fillText(completionDate, 180, 860);

        ctx.fillStyle = '#0E5858';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Certificate ID', W - 180, 830);
        ctx.fillStyle = '#333333';
        ctx.font = '300 18px Georgia, serif';
        ctx.fillText(certificateId, W - 180, 860);

        // ─── Signature line ──────────────────────────────────────
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 120, 880);
        ctx.lineTo(W / 2 + 120, 880);
        ctx.stroke();

        ctx.fillStyle = '#0E5858';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText('Khyati Rupani', W / 2, 870);

        ctx.fillStyle = '#888';
        ctx.font = '300 14px sans-serif';
        ctx.fillText('Founder & Chief Nutritionist', W / 2, 905);

        // ─── Footer ──────────────────────────────────────────────
        ctx.fillStyle = '#00B6C1';
        ctx.font = '600 11px sans-serif';
        ctx.fillText('www.balancenutrition.in  ·  BN Academy  ·  Internal Training Division', W / 2, 1020);

        // ─── Subtle Watermark ────────────────────────────────────
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.font = 'bold 200px Georgia, serif';
        ctx.fillStyle = '#0E5858';
        ctx.translate(W / 2, H / 2);
        ctx.rotate(-0.3);
        ctx.fillText('BN', 0, 0);
        ctx.restore();

        return canvas;
    }, [userName, completionDate, certificateId]);

    const handleDownload = async () => {
        const canvas = await generateCertificate();
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `BN_Certificate_${userName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
        onDownload?.();
    };

    const handleShare = async () => {
        const canvas = await generateCertificate();
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `BN_Certificate_${userName.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'BN Training Certificate',
                        text: `I have completed the Balance Nutrition Counsellor Training Program!`,
                        files: [file]
                    });
                } catch (e) {
                    // Fallback to download
                    handleDownload();
                }
            } else {
                handleDownload();
            }
        }, 'image/png');
    };

    return (
        <div className="space-y-4">
            {/* Certificate Preview */}
            <div className="relative bg-gradient-to-br from-[#FAFCEE] to-white rounded-2xl border border-[#0E5858]/10 p-6 text-center overflow-hidden">
                {/* Decorative corners */}
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-[#00B6C1]/30 rounded-tl-md" />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-[#00B6C1]/30 rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-[#00B6C1]/30 rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-[#00B6C1]/30 rounded-br-md" />

                <div className="w-12 h-12 bg-gradient-to-br from-[#FFCC00] to-[#F5A623] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Award size={24} className="text-white" />
                </div>
                <p className="text-[9px] font-black text-[#00B6C1] uppercase tracking-[0.3em] mb-1">Balance Nutrition</p>
                <p className="text-lg font-serif text-[#0E5858] mb-1">Certificate of Completion</p>
                <p className="text-sm font-serif text-[#0E5858] font-bold">{userName}</p>
                <p className="text-[10px] text-gray-400 mt-1">BN Counsellor Training Program · {completionDate}</p>
                <p className="text-[9px] text-gray-300 mt-1 font-mono">{certificateId}</p>
            </div>

            {/* Download & Share Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleDownload}
                    className="flex-1 py-3 bg-[#0E5858] text-white rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#00B6C1] transition-all shadow-lg"
                >
                    <Download size={16} />
                    Download Certificate
                </button>
                <button
                    onClick={handleShare}
                    className="py-3 px-4 bg-white border border-[#0E5858]/10 text-[#0E5858] rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#FAFCEE] transition-all"
                >
                    <Share2 size={16} />
                </button>
            </div>

            {/* Hidden canvas for generation */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
