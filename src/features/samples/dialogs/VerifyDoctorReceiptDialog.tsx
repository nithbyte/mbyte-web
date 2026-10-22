"use client";

import React from "react";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ShieldCheck } from "lucide-react";
import { DoctorSampleReceipt } from "@/services/sampleService";

interface VerifyDoctorReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReceipt: DoctorSampleReceipt | null;
}

export const VerifyDoctorReceiptDialog: React.FC<VerifyDoctorReceiptDialogProps> = ({
  isOpen,
  onClose,
  selectedReceipt,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physician Sample Receipt Verification"
      description="Cryptographic and digital audit evidence of physician physical handover."
    >
      {selectedReceipt ? (
        <div className="space-y-4 pt-2">
          <div className="p-3 bg-muted/40 rounded-lg space-y-2 border">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-foreground">Dr. {selectedReceipt.doctor?.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedReceipt.doctor?.clinicName} • {selectedReceipt.doctor?.specialty}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedReceipt.doctor?.address}</p>
              </div>
              <Badge variant="success" className="text-xs">
                {selectedReceipt.confirmationMethod.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-background border rounded-lg">
              <span className="text-muted-foreground font-medium block">Acknowledged At:</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {new Date(selectedReceipt.acknowledgedAt).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-background border rounded-lg">
              <span className="text-muted-foreground font-medium block">Attending MR:</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {selectedReceipt.mr?.user
                  ? `${selectedReceipt.mr.user.firstName} ${selectedReceipt.mr.user.lastName}`
                  : "Representative"}
              </span>
            </div>
          </div>

          {selectedReceipt.gpsLatitude && selectedReceipt.gpsLongitude && (
            <div className="p-2.5 bg-background border rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>GPS Verification Coordinates:</span>
              </div>
              <span className="font-mono font-semibold text-foreground">
                {selectedReceipt.gpsLatitude.toFixed(6)}, {selectedReceipt.gpsLongitude.toFixed(6)}
              </span>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-foreground block mb-1">Doctor Feedback / Remarks:</span>
            <p className="text-xs p-2.5 bg-muted/30 border rounded-lg text-foreground italic">
              "{selectedReceipt.doctorComments || "Physician verified physical sample handover without remarks."}"
            </p>
          </div>

          {selectedReceipt.signatureData && (
            <div>
              <span className="text-xs font-semibold text-foreground block mb-1">Digital Acknowledgment Proof:</span>
              <div className="p-3 bg-muted/20 border border-dashed rounded-lg flex items-center justify-center min-h-[80px]">
                {selectedReceipt.signatureData.startsWith("data:image") ? (
                  <img
                    src={selectedReceipt.signatureData}
                    alt="Doctor Signature"
                    className="max-h-24 max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <span className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">
                      {selectedReceipt.signatureData}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Receipt
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
