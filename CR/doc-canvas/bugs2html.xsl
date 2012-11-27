<!-- Version: $Id: bugs2html.xsl,v 1.3 2007/03/06 04:16:31 fsasaki Exp $-->
<!DOCTYPE xsl:transform [
<!ENTITY % specinfo SYSTEM "bugs2html-specinfo.dtd">
%specinfo;
]>
<xsl:transform version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="xs">
    <xsl:output method="xhtml" encoding="UTF-8" omit-xml-declaration="no"
        doctype-system="about:legacy-compat"
        />

    <xsl:variable name="comments-total" select="count(//bug)"/>
    <xsl:variable name="wgAcceptsComment" select="&wgAcceptsCommentXPath;"/>
    <xsl:variable name="wgRejectsComment" select="&wgRejectsCommentXPath;"/>
    <xsl:variable name="reviewerSatisfied" select="&reviewerSatisfiedXPath;"/>
    <xsl:variable name="reviewerNotSatisfied" select="&reviewerNotSatisfiedXPath;"/>
    <xsl:variable name="noResponse" select="&noResponseXPath;"/>
    <xsl:variable name="wgAcceptsCommentReviewerSatisfied"
        select="$wgAcceptsComment intersect $reviewerSatisfied"/>
    <xsl:variable name="wgAcceptsCommentReviewerNotSatisfied"
        select="$wgAcceptsComment intersect $reviewerNotSatisfied"/>
    <xsl:variable name="wgAcceptsCommentNoResponse" select="$wgAcceptsComment intersect $noResponse"/>
    <xsl:variable name="wgRejectsCommentReviewerSatisfied"
        select="$wgRejectsComment intersect $reviewerSatisfied"/>
    <xsl:variable name="wgRejectsCommentReviewerNotSatisfied"
        select="$wgRejectsComment intersect $reviewerNotSatisfied"/>
    <xsl:variable name="wgRejectsCommentNoResponse" select="$wgRejectsComment intersect $noResponse"/>
    <xsl:variable name="nonEditorialChange" select="&nonEditorialChangeXPath;"/>
    <xsl:variable name="externalComments" select="&externalCommentsXPath;"/>

    <xsl:template name="referenceIssues">
        <xsl:param name="issueStatus">notset</xsl:param>
        <xsl:param name="issueList">notSet</xsl:param>
        <xsl:param name="issueDesc">notSet</xsl:param>
        <xsl:variable name="issueTypeTotal" select="count($issueList)"/>
        <xsl:if test="$issueTypeTotal > 0">
          <xsl:text> (</xsl:text>
          <xsl:value-of
            select="round-half-to-even((($issueTypeTotal div $comments-total) * 100),2)"/>
          <xsl:text>%)</xsl:text>
        </xsl:if>
    </xsl:template>

    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
                <link rel="stylesheet" href="http://htmlwg.org/css/htmlwg.css"/>
                <title>&specTitle; Disposition of Comments</title>
                <style type="text/css"> body { font-family: sans-serif;} th { text-align: left; }
                  td, th { padding: 4px; } tr {background: #ddd;} table { width: 75% } table.issue {}
                  *.noResponse { background: #bbf; border: 2px solid #f33 }
                  *.changeDeclined { background: #fdc; border: 3px dotted #f33 } </style>
            </head>
            <body>
                <h1>&specTitle; Last Call Disposition of Comments</h1>
                <div>
                    <p>This is the Disposition of Comments for the &specPubDate;
                        &specStatus; of the &specLink;. This document lists the comments
                        received during the &specStatus; period and the extent to which the
                        &wg; believes they have been addressed. </p>
                </div>

                <p>Total number of comments: <xsl:value-of select="$comments-total"/></p>

                <table width="100%">
                    <tr>
                        <th>&#xa0;</th>
                        <th>Reviewer satisfied</th>
                        <th>Reviewer not satisfied</th>
                        <!-- * <td> -->
                            <!-- * <a href="#noResponse-listed">No reply from reviewer</a> -->
                        <!-- * </td> -->
                    </tr>
                    <tr>
                        <td>WG accepted comment
                        <xsl:call-template name="referenceIssues">
                            <xsl:with-param name="issueStatus">FIXED</xsl:with-param>
                            <xsl:with-param name="issueList" select="$wgAcceptsComment"/>
                            <xsl:with-param name="issueDesc">The Working Group has accepted the
                                proposal of the reviewer.</xsl:with-param>
                        </xsl:call-template>
                        </td>
                        <td>
                            <xsl:value-of select="count($wgAcceptsCommentReviewerSatisfied)"/>
                        </td>
                        <td>
                            <xsl:value-of select="count($wgAcceptsCommentReviewerNotSatisfied)"/>
                        </td>
                        <!-- * <td> -->
                            <!-- * <xsl:value-of select="count($wgAcceptsCommentNoResponse)"/> -->
                        <!-- * </td> -->
                    </tr>
                    <tr>
                        <td>WG rejected comment
                        <xsl:call-template name="referenceIssues">
                            <xsl:with-param name="issueStatus">changeDeclined</xsl:with-param>
                            <xsl:with-param name="issueList" select="$wgRejectsComment"/>
                            <xsl:with-param name="issueDesc">The Working Group has accepted the
                                proposal of the reviewer.</xsl:with-param>
                        </xsl:call-template>
                        </td>
                        <td>
                            <xsl:value-of select="count($wgRejectsCommentReviewerSatisfied)"/>
                        </td>
                        <td>
                            <xsl:value-of select="count($wgRejectsCommentReviewerNotSatisfied)"/>
                        </td>
                        <!-- * <td> -->
                            <!-- * <xsl:value-of select="count($wgRejectsCommentNoResponse)"/> -->
                        <!-- * </td> -->
                    </tr>
                </table>
                <h2>Detailed Description of Comments</h2>
                <xsl:apply-templates select="//bug">
                    <xsl:sort select="bug_id"/>
                </xsl:apply-templates>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="bug">
        <table class="issue" id="{concat('issue-',bug_id)}" width="100%"
            xmlns="http://www.w3.org/1999/xhtml">
            <tr>
                <td>
                    <b>
                        <xsl:value-of select="bug_id"/>
                    </b>
                    <xsl:text>: </xsl:text>
                    <a
                        href="{concat('http://www.w3.org/Bugs/Public/show_bug.cgi?id=',bug_id,'#c0')}">
                        <xsl:value-of select="short_desc"/>
                    </a>
                </td>
            </tr>
            <tr>
                <td>First recorded: <xsl:value-of select="substring-before(creation_ts,' ')"/></td>
            </tr>
            <tr>
                <td>Last modified: <xsl:value-of
                        select="substring-before(.//long_desc[last()]/bug_when,' ')"/></td>
            </tr>
            <tr>
                <td>
                    <xsl:text>Last modification: </xsl:text>
                    <p style="white-space: pre-wrap">
                    <xsl:choose>
                      <xsl:when test="
                        .//long_desc[last()]/thetext = 'mass-move component to LC1'
                        or 
                        .//long_desc[last()]/thetext = 'mass-moved component to LC1'
                        ">
                        <xsl:value-of select="concat('                  ', .//long_desc[last() - 1]/thetext)"/>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:value-of select="concat('                  ', .//long_desc[last()]/thetext)"/>
                      </xsl:otherwise>
                    </xsl:choose>
                    </p>
                </td>
            </tr>
            <tr>
                <td>Review Status: <xsl:call-template name="resolution"/></td>
            </tr>
        </table>
        <hr xmlns="http://www.w3.org/1999/xhtml"/>
    </xsl:template>

    <xsl:template name="resolution">
        <xsl:if test="exists($wgRejectsComment intersect .)">
            <span class="changeDeclined" xmlns="http://www.w3.org/1999/xhtml">Change declined.</span>
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($noResponse intersect .)">
            <span class="noResponse" xmlns="http://www.w3.org/1999/xhtml">No response from reviewer.</span>
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($wgAcceptsComment intersect .)">
            <span class="proposalAccepted" xmlns="http://www.w3.org/1999/xhtml">Working Group
                accepted proposal.</span>
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($reviewerNotSatisfied intersect .)">
            <span class="reviewerNotSatisfied" xmlns="http://www.w3.org/1999/xhtml">Reviewer is not
                satisfied.</span>
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($reviewerSatisfied intersect .)">
            <!-- * <span class="reviewerSatisfied" xmlns="http://www.w3.org/1999/xhtml">Reviewer is -->
                <!-- * satisfied.</span> -->
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($nonEditorialChange intersect .)">
            <span xmlns="http://www.w3.org/1999/xhtml">
                <b>Non-editorial change.</b>
            </span>
            <xsl:text> </xsl:text>
        </xsl:if>
        <xsl:if test="exists($externalComments intersect .)">
            <span xmlns="http://www.w3.org/1999/xhtml">
                <b>Working Group External Comment.</b>
            </span>
            <xsl:text> </xsl:text>
        </xsl:if>
    </xsl:template>
</xsl:transform>
