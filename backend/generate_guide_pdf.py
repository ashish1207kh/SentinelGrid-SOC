import os
import sys
from fpdf import FPDF

class IngestionGuidePDF(FPDF):
    def header(self):
        # Draw header top banner
        self.set_fill_color(10, 14, 23)
        self.rect(0, 0, 210, 25, 'F')
        
        # Header text
        self.set_text_color(0, 240, 255)
        self.set_font('Helvetica', 'B', 14)
        self.cell(0, -10, 'SENTINELGRID ENTERPRISE', align='L')
        self.ln(3)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, -10, 'Real-Time Data Ingestion & Integration Manual', align='L')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def create_guide_pdf():
    pdf = IngestionGuidePDF(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # Title Section
    pdf.set_font('Helvetica', 'B', 20)
    pdf.set_text_color(10, 14, 23)
    pdf.cell(0, 15, 'Real-Time Ingestion Architecture Guide', ln=True)
    pdf.ln(5)
    
    # Overview
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, '1. Overview of Ingestion System', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    overview_text = (
        "SentinelGrid operates on a schema-based log analyzer that parses events via unsupervised "
        "machine learning (Isolation Forest). To transition from simulation logs to live environment streams, "
        "production endpoints must forward logs conforming to the structured SentinelGrid schema."
    )
    pdf.multi_cell(0, 5, overview_text)
    pdf.ln(5)
    
    # Schema Specification
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(10, 14, 23)
    pdf.cell(0, 8, '2. Log Event Schema Format', ln=True)
    
    # Draw table header
    pdf.set_fill_color(226, 232, 240)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.cell(40, 7, 'Field Name', border=1, fill=True)
    pdf.cell(30, 7, 'Data Type', border=1, fill=True)
    pdf.cell(120, 7, 'Description & Examples', border=1, fill=True)
    pdf.ln()
    
    # Table rows
    pdf.set_font('Helvetica', '', 8)
    schema_fields = [
        ("timestamp", "String (ISO8601)", "ISO timestamp. e.g., '2026-07-02T16:18:21+05:30'"),
        ("username", "String", "User identifier or system account name. e.g., 'dr_sharma'"),
        ("event_type", "String", "Event class: 'login', 'access_server', 'privilege_change', 'data_transfer'"),
        ("ip_address", "String (IPv4)", "Origin IP of request. e.g., '95.213.255.1'"),
        ("country", "String", "Source country geolocated from IP. e.g., 'Russia'"),
        ("city", "String", "Source city context. e.g., 'Moscow'"),
        ("server", "String", "Target system asset name. e.g., 'backup_server'"),
        ("data_transferred_mb", "Float", "Payload transfer size in megabytes. e.g., 4500.0"),
        ("privilege_level", "String", "Account clearance role: 'user' or 'admin'"),
        ("status", "String", "Outcome of operation: 'success' or 'failed'")
    ]
    
    for field, f_type, desc in schema_fields:
        pdf.cell(40, 6, field, border=1)
        pdf.cell(30, 6, f_type, border=1)
        pdf.cell(120, 6, desc, border=1)
        pdf.ln()
        
    pdf.ln(5)
    
    # API Integration
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, '3. API Ingestion Endpoint (Live Integration)', ln=True)
    pdf.set_font('Helvetica', '', 10)
    api_text = (
        "Logs should be POSTed in JSON format to the endpoint: http://localhost:8000/api/logs/ingest.\n"
        "Your streaming agent (e.g. FluentBit, Logstash) should send a JSON payload structured "
        "matching the schema fields above. The API immediately feeds this to the model."
    )
    pdf.multi_cell(0, 5, api_text)
    pdf.ln(5)
    
    # Collector Configs
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, '4. Stream Collector Configurations', ln=True)
    pdf.set_font('Helvetica', '', 10)
    collector_text = (
        "- Windows Systems: Use Windows Event Forwarding (WEF) combined with NXLog to capture "
        "Security Event IDs (4624 for Login, 4720 for User Creation) and convert to SentinelGrid format.\n"
        "- Linux Servers: Configure Rsyslog to parse sshd logs and auditd logs, forwarding as JSON packages.\n"
        "- Network Devices: Forward syslog messages to a centralized Logstash container for mapping."
    )
    pdf.multi_cell(0, 5, collector_text)
    
    pdf.output("E:/cyber-resilience/REALTIME_DATA_INGESTION_GUIDE.pdf")
    print("PDF Ingestion Guide generated at E:/cyber-resilience/REALTIME_DATA_INGESTION_GUIDE.pdf")

if __name__ == "__main__":
    create_guide_pdf()
